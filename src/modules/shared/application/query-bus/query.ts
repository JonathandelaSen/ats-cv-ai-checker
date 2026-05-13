export interface Query<TPayload, TResult> {
  readonly queryName: string;
  readonly payload: TPayload;
  readonly resultType?: TResult;
}
