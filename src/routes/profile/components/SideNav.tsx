import { PAGE_SECTIONS, type PageSectionsIdType } from "@/constants/profile";

type SideNavProps = {
  activeId: PageSectionsIdType;
  onSelect: (id: PageSectionsIdType) => void;
};

export function SideNav({ activeId, onSelect }: SideNavProps) {
  return (
    <aside className="fixed right-6 top-20 z-30 hidden w-52 lg:block">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Account
      </p>
      <nav>
        <ul className="flex flex-col gap-1 border-l border-neutral-200">
          {PAGE_SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                aria-current={activeId === id ? "location" : undefined}
                className={[
                  "w-full border-l-2 px-3 py-2 text-left text-sm transition-all duration-150",
                  activeId === id
                    ? "border-green-600 font-medium text-green-700"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800",
                ].join(" ")}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
