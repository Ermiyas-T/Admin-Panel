import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Action, AppAbility, Subject } from "./types";

export function defineAbilityFor(permissionStrings: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const perm of permissionStrings) {
    // Permission format: "action:subject"
    const [action, subject] = perm.split(":") as [Action, Subject];

    // Basic validation: if action or subject is not recognized, skip or throw?
    // For now, we trust the token/permissions are valid.
    // But we could check if action and subject are in our enums.
    can(action, subject);
    // Note: CASL's `can` accepts wildcards: can('manage', 'all') would be handled automatically
  }

  return build({
    // Detect subject type – needed for CASL to understand that we are using string subjects
    detectSubjectType: (item) => item as any, // For our case, subjects are strings (not objects)
  });
}
