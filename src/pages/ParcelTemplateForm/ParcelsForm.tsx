import { Step, StepContent, StepLabel } from "@mui/material";
import { Package } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/Button";
import { FormItem } from "@/components/Form/FormItem";
import { Input } from "@/components/Input";
import NumericInput from "@/components/Input/NumericInput";
import { Select } from "@/components/Select/Select";
import type { ParcelItemType } from "@/types/parcel-templates";
import type { ItemDraft } from "./types";
import type { ItemDraftErrors } from "./parcel-items";

const STEP_LABEL_SX = {
  px: 0,
  py: 0,
  "& .MuiStepLabel-iconContainer": { display: "none" },
  "& .MuiStepLabel-label": {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#a3a3a3",
  },
} as const;

const STEP_CONTENT_LAST_SX = {
  borderLeft: "none",
  ml: "0px",
  pl: "0px",
  pb: 0,
  pt: "12px",
} as const;

const itemTypeOptions: { value: ParcelItemType; label: string }[] = [
  { value: "PACKAGE", label: "Package" },
  { value: "DOCUMENT", label: "Document" },
  { value: "BOX", label: "Box" },
];

const defaultDocumentTypeOptions = [
  { value: "Contract", label: "Contract" },
  { value: "Invoice", label: "Invoice" },
  { value: "ID", label: "ID" },
  { value: "Other", label: "Other" },
];

interface ParcelsFormProps {
  items: ItemDraft[];
  itemErrors: ItemDraftErrors[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, patch: Partial<ItemDraft>) => void;
}

export function ParcelsForm({
  items,
  itemErrors,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: ParcelsFormProps) {
  return (
    <Step expanded>
      <StepLabel sx={STEP_LABEL_SX}>
        <span className="inline-flex items-center gap-2">
          <Package size={14} strokeWidth={2} />
          <span>Parcel items</span>
        </span>
      </StepLabel>
      <StepContent sx={STEP_CONTENT_LAST_SX}>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <ParcelItemRow
                key={index}
                index={index}
                item={item}
                errors={itemErrors[index] ?? {}}
                onUpdate={(patch) => onUpdateItem(index, patch)}
                onRemove={() => onRemoveItem(index)}
                canRemove={items.length > 1}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            color="green"
            size="sm"
            className="mt-4"
            onClick={onAddItem}
          >
            + Add item
          </Button>
        </div>
      </StepContent>
    </Step>
  );
}

interface ParcelItemRowProps {
  index: number;
  item: ItemDraft;
  errors: ItemDraftErrors;
  onUpdate: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ParcelItemRow({
  index,
  item,
  errors,
  onUpdate,
  onRemove,
  canRemove,
}: ParcelItemRowProps) {
  function handleTypeChange(newType: ParcelItemType) {
    onUpdate({
      type: newType,
      documentType: "",
      declaredValue: "",
      height: "",
      width: "",
      length: "",
    });
  }

  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Item {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      <FormItem className="mb-3">
        <Label className="text-sm font-medium text-gray-700">Type</Label>
        <Select
          value={item.type}
          onValueChange={(value) => handleTypeChange(value as ParcelItemType)}
          options={itemTypeOptions}
          color="green"
          error={errors.type?.[0]}
        />
      </FormItem>

      {item.type === "DOCUMENT" && (
        <DocumentFields item={item} errors={errors} onUpdate={onUpdate} />
      )}
      {item.type === "PACKAGE" && (
        <PackageFields item={item} errors={errors} onUpdate={onUpdate} />
      )}
      {item.type === "BOX" && (
        <BoxFields item={item} errors={errors} onUpdate={onUpdate} />
      )}
    </div>
  );
}

interface FieldsProps {
  item: ItemDraft;
  errors: ItemDraftErrors;
  onUpdate: (patch: Partial<ItemDraft>) => void;
}

function DocumentFields({ item, errors, onUpdate }: FieldsProps) {
  const documentTypeOptions =
    item.documentType &&
    !defaultDocumentTypeOptions.some((option) => option.value === item.documentType)
      ? [{ value: item.documentType, label: item.documentType }, ...defaultDocumentTypeOptions]
      : defaultDocumentTypeOptions;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select
        label="Document type"
        value={item.documentType || undefined}
        onValueChange={(value) => onUpdate({ documentType: value })}
        options={documentTypeOptions}
        placeholder="Select document type"
        color="green"
        error={errors.documentType?.[0]}
      />
      <NumericInput
        label="Weight (kg)"
        placeholder="0.05"
        value={item.weight}
        onChange={(value) => onUpdate({ weight: value })}
        error={errors.weight?.[0]}
      />
      <NumericInput
        label="Declared value (optional)"
        placeholder="0"
        value={item.declaredValue}
        onChange={(value) => onUpdate({ declaredValue: value })}
        error={errors.declaredValue?.[0]}
      />
      <Input
        label="Description (optional)"
        placeholder="Signed contract copy"
        value={item.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        color="green"
        error={errors.description?.[0]}
      />
    </div>
  );
}

function PackageFields({ item, errors, onUpdate }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NumericInput
        label="Declared value"
        placeholder="100"
        value={item.declaredValue}
        onChange={(value) => onUpdate({ declaredValue: value })}
        error={errors.declaredValue?.[0]}
      />
      <NumericInput
        label="Weight (kg)"
        placeholder="1.5"
        value={item.weight}
        onChange={(value) => onUpdate({ weight: value })}
        error={errors.weight?.[0]}
      />
      <NumericInput
        label="Height (cm, optional)"
        placeholder="15"
        value={item.height}
        onChange={(value) => onUpdate({ height: value })}
        error={errors.height?.[0]}
      />
      <NumericInput
        label="Width (cm, optional)"
        placeholder="10"
        value={item.width}
        onChange={(value) => onUpdate({ width: value })}
        error={errors.width?.[0]}
      />
      <NumericInput
        label="Length (cm, optional)"
        placeholder="20"
        value={item.length}
        onChange={(value) => onUpdate({ length: value })}
        error={errors.length?.[0]}
      />
      <Input
        label="Description (optional)"
        placeholder="Gift set"
        value={item.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        color="green"
        error={errors.description?.[0]}
      />
    </div>
  );
}

function BoxFields({ item, errors, onUpdate }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NumericInput
        label="Declared value"
        placeholder="200"
        value={item.declaredValue}
        onChange={(value) => onUpdate({ declaredValue: value })}
        error={errors.declaredValue?.[0]}
      />
      <NumericInput
        label="Weight (kg)"
        placeholder="3"
        value={item.weight}
        onChange={(value) => onUpdate({ weight: value })}
        error={errors.weight?.[0]}
      />
      <NumericInput
        label="Height (cm)"
        placeholder="30"
        value={item.height}
        onChange={(value) => onUpdate({ height: value })}
        error={errors.height?.[0]}
      />
      <NumericInput
        label="Width (cm)"
        placeholder="20"
        value={item.width}
        onChange={(value) => onUpdate({ width: value })}
        error={errors.width?.[0]}
      />
      <NumericInput
        label="Length (cm)"
        placeholder="40"
        value={item.length}
        onChange={(value) => onUpdate({ length: value })}
        error={errors.length?.[0]}
      />
      <Input
        label="Description"
        placeholder="Electronics - handle with care"
        value={item.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        color="green"
        error={errors.description?.[0]}
      />
    </div>
  );
}
