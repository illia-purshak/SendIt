import type {
  ParcelItem,
  ParcelItemPayload,
  ParcelItemType,
} from "@/types/parcel-templates";
import type { ItemDraft } from "./types";

export type ItemDraftField = keyof ItemDraft;
export type ItemDraftErrors = Partial<Record<ItemDraftField, string[]>>;

export function emptyDraft(type: ParcelItemType = "PACKAGE"): ItemDraft {
  return {
    type,
    documentType: "",
    declaredValue: "",
    weight: "",
    description: "",
    height: "",
    width: "",
    length: "",
  };
}

export function itemToDraft(item: ParcelItem): ItemDraft {
  const base: ItemDraft = {
    id: item.id,
    type: item.type,
    documentType: "",
    declaredValue: "",
    weight: item.weight != null ? String(item.weight) : "",
    description: item.description ?? "",
    height: "",
    width: "",
    length: "",
  };

  if (item.type === "DOCUMENT") {
    return {
      ...base,
      documentType: item.documentType,
      declaredValue:
        item.declaredValue != null ? String(item.declaredValue) : "",
    };
  }

  if (item.type === "PACKAGE") {
    return {
      ...base,
      declaredValue: String(item.declaredValue),
      height: item.height != null ? String(item.height) : "",
      width: item.width != null ? String(item.width) : "",
      length: item.length != null ? String(item.length) : "",
    };
  }

  return {
    ...base,
    declaredValue: String(item.declaredValue),
    height: String(item.height),
    width: String(item.width),
    length: String(item.length),
  };
}

export function draftToItem(draft: ItemDraft): ParcelItemPayload {
  const weight = draft.weight ? parseFloat(draft.weight) : undefined;

  if (draft.type === "DOCUMENT") {
    return {
      type: "DOCUMENT",
      documentType: draft.documentType.trim(),
      weight,
      declaredValue: draft.declaredValue
        ? parseFloat(draft.declaredValue)
        : undefined,
      description: draft.description.trim() || undefined,
    };
  }

  if (draft.type === "PACKAGE") {
    return {
      type: "PACKAGE",
      declaredValue: parseFloat(draft.declaredValue),
      weight,
      height: draft.height ? parseFloat(draft.height) : undefined,
      width: draft.width ? parseFloat(draft.width) : undefined,
      length: draft.length ? parseFloat(draft.length) : undefined,
      description: draft.description.trim() || undefined,
    };
  }

  return {
    type: "BOX",
    declaredValue: parseFloat(draft.declaredValue),
    weight,
    height: parseFloat(draft.height),
    width: parseFloat(draft.width),
    length: parseFloat(draft.length),
    description: draft.description.trim(),
  };
}

export function getItemErrors(items: ItemDraft[]): ItemDraftErrors[] {
  const errors: ItemDraftErrors[] = items.map(() => ({}));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemErrors = errors[i];

    if (item.type === "DOCUMENT") {
      if (!item.documentType.trim()) {
        itemErrors.documentType = ["Document type is required"];
      }

      const declaredValue = parseFloat(item.declaredValue);
      if (
        item.declaredValue !== "" &&
        (Number.isNaN(declaredValue) || declaredValue < 0)
      ) {
        itemErrors.declaredValue = ["Declared value must be >= 0"];
      }
    } else if (item.type === "PACKAGE") {
      const declaredValue = parseFloat(item.declaredValue);
      if (
        item.declaredValue === "" ||
        Number.isNaN(declaredValue) ||
        declaredValue < 0
      ) {
        itemErrors.declaredValue = [
          "Declared value is required and must be >= 0",
        ];
      }

      if (item.height) {
        const height = parseFloat(item.height);
        if (Number.isNaN(height) || height <= 0) {
          itemErrors.height = ["Height must be positive"];
        }
      }

      if (item.width) {
        const width = parseFloat(item.width);
        if (Number.isNaN(width) || width <= 0) {
          itemErrors.width = ["Width must be positive"];
        }
      }

      if (item.length) {
        const length = parseFloat(item.length);
        if (Number.isNaN(length) || length <= 0) {
          itemErrors.length = ["Length must be positive"];
        }
      }
    } else {
      const declaredValue = parseFloat(item.declaredValue);
      if (
        item.declaredValue === "" ||
        Number.isNaN(declaredValue) ||
        declaredValue < 0
      ) {
        itemErrors.declaredValue = [
          "Declared value is required and must be >= 0",
        ];
      }

      const height = parseFloat(item.height);
      const width = parseFloat(item.width);
      const length = parseFloat(item.length);

      if (!item.height || Number.isNaN(height) || height <= 0) {
        itemErrors.height = ["Height is required and must be positive"];
      }
      if (!item.width || Number.isNaN(width) || width <= 0) {
        itemErrors.width = ["Width is required and must be positive"];
      }
      if (!item.length || Number.isNaN(length) || length <= 0) {
        itemErrors.length = ["Length is required and must be positive"];
      }
      if (!item.description.trim()) {
        itemErrors.description = ["Description is required for box"];
      }
    }

    if (item.weight) {
      const weight = parseFloat(item.weight);
      if (Number.isNaN(weight) || weight <= 0) {
        itemErrors.weight = ["Weight must be positive"];
      }
    }
  }

  return errors;
}

export function validateItems(items: ItemDraft[]): string | null {
  if (items.length === 0) return "At least one parcel item is required";

  const errors = getItemErrors(items);

  for (let index = 0; index < errors.length; index++) {
    const itemErrors = errors[index];

    for (const fieldErrors of Object.values(itemErrors)) {
      const error = fieldErrors?.find(Boolean);
      if (error) return `Item ${index + 1}: ${error}`;
    }
  }

  return null;
}
