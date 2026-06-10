import { normalizeUaPhone } from "@/utils/validation";

export const POSTAL_SERVICE_MODE_REQUIREMENTS = {
  "nova-poshta": {
    division: true,
    postalCode: false,
    city: false,
    address: false,
    dimensions: true,
    insurance: true,
  },
  ukrposhta: {
    division: false,
    postalCode: true,
    city: true,
    address: true,
    dimensions: false,
    insurance: false,
  },
  meest: {
    division: false,
    postalCode: false,
    city: true,
    address: true,
    dimensions: true,
    insurance: false,
  },
} as const;

export type PostalServiceMode = keyof typeof POSTAL_SERVICE_MODE_REQUIREMENTS;

export interface ShipmentFormData {
  postalServiceMode: PostalServiceMode;
  payerType: "Sender" | "Recipient" | "ThirdPerson";
  payerContractNumber: string;
  clientOrder: string;
  note: string;
  deliveryType: "" | "standard" | "economy" | "express";
  readyToShip: boolean;
  sender: {
    name: string;
    phone: string;
    countryCode: string;
    divisionNumber: string;
    city: string;
    address: string;
    postalCode: string;
  };
  recipient: {
    name: string;
    phone: string;
    countryCode: string;
    divisionNumber: string;
    city: string;
    address: string;
    postalCode: string;
  };
  parcel: {
    cargoCategory: "parcel" | "documents" | "pallet";
    parcelDescription: string;
    insuranceCost: number;
    actualWeight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  invoice: {
    cost: number;
    currency: string;
  };
}

type RecordLike = Record<string, unknown>;

export const DEFAULT_SHIPMENT_FORM_DATA: ShipmentFormData = {
  postalServiceMode: "nova-poshta",
  payerType: "Sender",
  payerContractNumber: "",
  clientOrder: "",
  note: "",
  deliveryType: "",
  readyToShip: false,
  sender: {
    name: "",
    phone: "",
    countryCode: "UA",
    divisionNumber: "",
    city: "",
    address: "",
    postalCode: "",
  },
  recipient: {
    name: "",
    phone: "",
    countryCode: "UA",
    divisionNumber: "",
    city: "",
    address: "",
    postalCode: "",
  },
  parcel: {
    cargoCategory: "parcel",
    parcelDescription: "",
    insuranceCost: 0,
    actualWeight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
  },
  invoice: {
    cost: 0,
    currency: "UAH",
  },
};

export function normalizePostalServiceMode(value?: string | null): PostalServiceMode {
  switch (value) {
    case "nova-poshta":
    case "nova-post":
      return "nova-poshta";
    case "ukrposhta":
      return "ukrposhta";
    case "meest":
      return "meest";
    default:
      return "nova-poshta";
  }
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): RecordLike | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : undefined;
}

function pickParcelRecord(data: RecordLike): RecordLike {
  const parcel = asRecord(data.parcel);
  if (parcel) return parcel;

  const parcels = Array.isArray(data.parcels) ? data.parcels : undefined;
  const firstParcel = parcels?.[0];
  return asRecord(firstParcel) ?? {};
}

export function mapShipmentSourceToFormData(
  data: Record<string, unknown>,
  fallbackMode?: string | null,
): ShipmentFormData {
  const parcel = pickParcelRecord(data);
  const dimensions = asRecord(parcel.dimensions) ?? {};
  const operator = data.operator;
  const operatorRecord = asRecord(operator);
  const mode = normalizePostalServiceMode(
    (data.postalServiceMode as string | undefined)
      ?? (typeof operator === "string" ? operator : (operatorRecord?.slug as string | undefined))
      ?? fallbackMode,
  );

  const dataParcel = asRecord(data.parcel);
  const dataParcelDimensions = asRecord(dataParcel?.dimensions);
  const actualWeight =
    dataParcel?.actualWeight != null
      ? toFiniteNumber(dataParcel.actualWeight)
      : parcel.actualWeight != null
        ? toFiniteNumber(parcel.actualWeight) / 1000
        : data.weight != null
          ? toFiniteNumber(data.weight) / 1000
          : DEFAULT_SHIPMENT_FORM_DATA.parcel.actualWeight;
  const length =
    dataParcelDimensions?.length != null
      ? toFiniteNumber(dataParcelDimensions.length)
      : toFiniteNumber(parcel.length ?? dimensions.length) / 10;
  const width =
    dataParcelDimensions?.width != null
      ? toFiniteNumber(dataParcelDimensions.width)
      : toFiniteNumber(parcel.width ?? dimensions.width) / 10;
  const height =
    dataParcelDimensions?.height != null
      ? toFiniteNumber(dataParcelDimensions.height)
      : toFiniteNumber(parcel.height ?? dimensions.height) / 10;

  const sender = asRecord(data.sender);
  const recipient = asRecord(data.recipient);
  const invoice = asRecord(data.invoice);

  return {
    postalServiceMode: mode,
    payerType: (data.payerType as ShipmentFormData["payerType"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.payerType,
    payerContractNumber: (data.payerContractNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.payerContractNumber,
    clientOrder: (data.clientOrder as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.clientOrder,
    note: (data.note as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.note,
    deliveryType: (data.deliveryType as ShipmentFormData["deliveryType"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.deliveryType,
    readyToShip: (data.readyToShip as boolean | undefined) ?? data.status === "ReadyToShip",
    sender: {
      name: (sender?.name as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.name,
      phone: (sender?.phone as string | undefined)
        ? normalizeUaPhone(sender.phone as string)
        : DEFAULT_SHIPMENT_FORM_DATA.sender.phone,
      countryCode: (sender?.countryCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.countryCode,
      divisionNumber: (sender?.divisionNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.divisionNumber,
      city: (sender?.city as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.city,
      address: (sender?.address as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.address,
      postalCode: (sender?.postalCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.postalCode,
    },
    recipient: {
      name: (recipient?.name as string | undefined) ?? (data.recipientName as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.name,
      phone: (recipient?.phone as string | undefined)
        ? normalizeUaPhone(recipient.phone as string)
        : (data.recipientPhone as string | undefined)
          ? normalizeUaPhone(data.recipientPhone as string)
          : DEFAULT_SHIPMENT_FORM_DATA.recipient.phone,
      countryCode: (recipient?.countryCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.countryCode,
      divisionNumber: (recipient?.divisionNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.divisionNumber,
      city: (recipient?.city as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.city,
      address: (recipient?.address as string | undefined) ?? (data.deliveryAddress as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.address,
      postalCode: (recipient?.postalCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.postalCode,
    },
    parcel: {
      cargoCategory: ((parcel.cargoCategory as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.parcel.cargoCategory) as ShipmentFormData["parcel"]["cargoCategory"],
      parcelDescription: (parcel.parcelDescription as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.parcel.parcelDescription,
      insuranceCost: toFiniteNumber(parcel.insuranceCost, DEFAULT_SHIPMENT_FORM_DATA.parcel.insuranceCost),
      actualWeight,
      dimensions: {
        length,
        width,
        height,
      },
    },
    invoice: {
      cost: invoice?.cost != null
        ? toFiniteNumber(invoice.cost)
        : toFiniteNumber(data.declaredValue, DEFAULT_SHIPMENT_FORM_DATA.invoice.cost),
      currency: (invoice?.currency as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.currency,
    },
  };
}

export function serializeShipmentFormDataForTemplate(values: ShipmentFormData): Record<string, unknown> {
  return {
    postalServiceMode: values.postalServiceMode,
    payerType: values.payerType,
    payerContractNumber: values.payerContractNumber,
    clientOrder: values.clientOrder,
    note: values.note,
    deliveryType: values.deliveryType,
    readyToShip: values.readyToShip,
    sender: { ...values.sender },
    recipient: { ...values.recipient },
    parcel: {
      ...values.parcel,
      dimensions: { ...values.parcel.dimensions },
    },
    invoice: { ...values.invoice },
  };
}
