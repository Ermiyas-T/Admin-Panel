import { AbilityBuilder, PureAbility } from "@casl/ability";
import { Action, Subject } from "@/types";

export type AppAbility = PureAbility<[Action, Subject]>;

export function defineAbilityFor(permissions: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(PureAbility);

  permissions.forEach((perm) => {
    const [action, subject] = perm.split(":") as [Action, Subject];
    can(action, subject);
  });

  return build({
    detectSubjectType: (object) => object as Subject,
  });
}
