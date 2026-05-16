"use server";

import { CV_PDFS_BUCKET } from "@/modules/cv-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isInterfaceLanguage, type InterfaceLanguage } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthFormState = {
  error?: string;
  message?: string;
  email?: string;
  canResendConfirmation?: boolean;
};

function getActionMessages(formData: FormData) {
  const localeValue = String(formData.get("interfaceLanguage") || "");
  const locale: InterfaceLanguage = isInterfaceLanguage(localeValue)
    ? localeValue
    : "en";

  return getMessages(locale).auth;
}

function getCredentials(formData: FormData) {
  const t = getActionMessages(formData);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: t.errors.missingCredentials };
  }

  if (password.length < 6) {
    return { error: t.errors.passwordTooShort };
  }

  return { email, password };
}

function getPasswordChange(formData: FormData) {
  const t = getActionMessages(formData);
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!password || !confirmPassword) {
    return { error: t.errors.confirmNewPassword };
  }

  if (password.length < 6) {
    return { error: t.errors.passwordTooShort };
  }

  if (password !== confirmPassword) {
    return { error: t.errors.passwordsDoNotMatch };
  }

  return { password };
}

async function getEmailRedirectTo(next = "/") {
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://127.0.0.1:3000";

  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function isEmailNotConfirmedError(error: { code?: string; message?: string }) {
  return (
    error.code === "email_not_confirmed" ||
    Boolean(error.message?.toLowerCase().includes("email not confirmed"))
  );
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const credentials = getCredentials(formData);
  if ("error" in credentials) return { error: credentials.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    if (isEmailNotConfirmedError(error)) {
      return {
        error: t.errors.confirmEmailBeforeLogin,
        email: credentials.email,
        canResendConfirmation: true,
      };
    }

    return { error: t.errors.signInFailed };
  }

  const localeValue = String(formData.get("interfaceLanguage") || "");
  if (isInterfaceLanguage(localeValue)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: existingPreference } = await supabase
        .from("user_preferences")
        .select("interface_language")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isInterfaceLanguage(existingPreference?.interface_language)) {
        await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            interface_language: localeValue,
          },
          { onConflict: "user_id" },
        );
      }
    }
  }

  redirect("/");
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const credentials = getCredentials(formData);
  if ("error" in credentials) return { error: credentials.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: await getEmailRedirectTo("/"),
    },
  });

  if (error) {
    return { error: t.errors.signUpFailed };
  }

  return {
    message: t.messages.confirmationSent,
    email: credentials.email,
    canResendConfirmation: true,
  };
}

export async function resendConfirmationEmail(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { error: t.errors.resendMissingEmail };
  }

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: await getEmailRedirectTo("/"),
    },
  });

  return {
    message: t.messages.confirmationResent,
    email,
    canResendConfirmation: true,
  };
}

export async function updatePasswordFromRecovery(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const passwordResult = getPasswordChange(formData);
  if ("error" in passwordResult) return { error: passwordResult.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordResult.password,
  });

  if (error) {
    return { error: t.errors.updatePasswordFailed };
  }

  redirect("/");
}

export async function changePasswordWithCurrent(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const currentPassword = String(formData.get("currentPassword") || "");
  const passwordResult = getPasswordChange(formData);

  if (!currentPassword) {
    return { error: t.errors.missingCurrentPassword };
  }

  if ("error" in passwordResult) return { error: passwordResult.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: t.errors.signInAgain };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: t.errors.wrongCurrentPassword };
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordResult.password,
    current_password: currentPassword,
  });

  if (error) {
    return { error: t.errors.updateCurrentPasswordFailed };
  }

  return { message: t.messages.passwordChanged };
}

export async function deleteAccount(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = getActionMessages(formData);
  const emailConfirmation = String(
    formData.get("emailConfirmation") || "",
  ).trim();
  const password = String(formData.get("password") || "");

  if (!emailConfirmation || !password) {
    return {
      error: t.errors.deleteMissingCredentials,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: t.errors.signInAgain };
  }

  if (emailConfirmation.toLowerCase() !== user.email.toLowerCase()) {
    return { error: t.errors.deleteEmailMismatch };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) {
    return { error: t.errors.deleteWrongPassword };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : t.errors.deleteNotConfigured,
    };
  }

  const { data: cvs, error: cvsError } = await supabase
    .from("cvs")
    .select("pdf_storage_path")
    .eq("user_id", user.id);
  const { data: cvAnalyses, error: cvAnalysesError } = await supabase
    .from("cv_analyses")
    .select("pdf_storage_path")
    .eq("user_id", user.id);
  const { data: jobMatchAnalyses, error: jobMatchAnalysesError } =
    await supabase
      .from("job_match_analyses")
      .select("pdf_storage_path")
      .eq("user_id", user.id);

  if (cvsError || cvAnalysesError || jobMatchAnalysesError) {
    return { error: t.errors.deletePrepareFailed };
  }

  const storagePaths = Array.from(
    new Set(
      [...(cvs ?? []), ...(cvAnalyses ?? []), ...(jobMatchAnalyses ?? [])]
        .map((item) => item.pdf_storage_path)
        .filter((path): path is string => Boolean(path)),
    ),
  );

  if (storagePaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(CV_PDFS_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      return { error: "No he podido borrar los PDFs de la cuenta." };
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { error: "No he podido borrar la cuenta." };
  }

  await supabase.auth.signOut();
  redirect("/login?accountDeleted=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
