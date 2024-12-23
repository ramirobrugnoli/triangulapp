import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { Player } from "@/types";

interface Props {
  id: string;
  items: Player[];
  title: string;
  className?: string;
  itemClassName?: string;
}

export function DroppableContainer({
  id,
  items,
  title,
  className = "",
  itemClassName = "",
}: Props) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <SortableContext
        id={id}
        items={items}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`bg-gray-800 rounded p-2 ${className}`}
        >
          {items.map((player) => (
            <SortableItem
              key={player.id}
              id={player.id}
              className={itemClassName}
            >
              {player.name}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
