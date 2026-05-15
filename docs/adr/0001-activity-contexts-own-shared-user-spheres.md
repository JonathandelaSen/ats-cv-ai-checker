# Activity Contexts Own Shared User Spheres

Activity Contexts are owned by a dedicated module rather than by journal, commitments, or received feedback because they represent the same reusable user sphere across those product areas. Feature sections may offer embedded UI for creating and selecting Activity Contexts, but they reference them by ID and delegate creation, listing, archiving, and deletion to the Activity Context module so records stay unified across the app.

## Consequences

- Journal entries, commitments, and received feedback store an Activity Context ID, not a copied context name.
- Records created without an explicit Activity Context are assigned to the user's General Activity Context.
- Deleting an Activity Context requires confirmation when records are attached and reassigns those records to General; General itself cannot be deleted.
