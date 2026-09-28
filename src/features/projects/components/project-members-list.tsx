import { getUserInitials } from '@/features/auth/utils/get-user-initials';
import { cn } from '@/lib/cn';

import type { ProjectMember, ProjectMemberRole } from '../types/project-member';

type ProjectMembersListProps = {
  members: ProjectMember[];
};

const roleStyles: Record<ProjectMemberRole, string> = {
  owner: 'bg-primary-container text-on-primary',
  admin: 'bg-[#cdddff] text-foreground-muted',
  member: 'bg-surface-highest text-foreground-secondary',
  viewer: 'bg-surface-icon text-foreground-secondary',
};

function MemberRoleBadge({ role }: { role: ProjectMemberRole }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[10px] leading-3 font-bold tracking-[0.5px] uppercase',
        roleStyles[role],
      )}
    >
      {role}
    </span>
  );
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <div className="bg-surface-nested text-primary flex size-12 shrink-0 items-center justify-center rounded-[12px] text-sm leading-5 font-bold">
      {getUserInitials(name)}
    </div>
  );
}

export function ProjectMembersList({ members }: ProjectMembersListProps) {
  return (
    <>
      <div className="hidden justify-center lg:flex">
        <div className="bg-surface-low rounded-md p-1">
          <div className="bg-surface w-[577px] overflow-hidden rounded-md shadow-sm">
            <div className="bg-surface-nested/30 grid grid-cols-[389px_188px]">
              <div className="px-8 py-5">
                <span className="text-foreground-secondary text-[11px] font-bold tracking-[1.1px] uppercase">
                  Member
                </span>
              </div>

              <div className="px-8 py-5">
                <span className="text-foreground-secondary text-[11px] font-bold tracking-[1.1px] uppercase">
                  Role
                </span>
              </div>
            </div>

            <div>
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className={cn(
                    'grid grid-cols-[389px_188px] items-center',
                    index > 0 && 'border-surface-icon border-t',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-4 px-8 py-[18px]">
                    <MemberAvatar name={member.name} />

                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm leading-5 font-semibold">
                        {member.name}
                      </p>

                      <p
                        title={member.email}
                        className="text-foreground-secondary truncate text-xs leading-4"
                      >
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-[34px]">
                    <MemberRoleBadge role={member.role} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {members.map((member) => (
          <article
            key={member.id}
            className="bg-surface flex min-w-0 items-center justify-between gap-3 rounded-md p-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <MemberAvatar name={member.name} />

              <div className="min-w-0">
                <h2 className="text-foreground truncate text-sm leading-5 font-semibold">
                  {member.name}
                </h2>

                <p
                  title={member.email}
                  className="text-foreground-secondary truncate text-[11px] leading-[16.5px]"
                >
                  {member.email}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <MemberRoleBadge role={member.role} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
