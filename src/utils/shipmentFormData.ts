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
  status?: "ReadyToShip";
  sender: {
    name: string;
    phone: string;
    email?: string;
    countryCode: string;
    companyTin?: string;
    companyName?: string;
    eoriCode?: string;
    divisionNumber: string;
    city: string;
    address: string;
    postalCode: string;
    addressParts?: {
      city?: string;
      street?: string;
      building?: string;
      flat?: string;
      postCode?: string;
      region?: string;
    };
  };
  recipient: {
    name: string;
    phone: string;
    email?: string;
    countryCode: string;
    divisionNumber: string;
    city: string;
    address: string;
    postalCode: string;
    addressParts?: {
      city?: string;
      street?: string;
      building?: string;
      flat?: string;
      postCode?: string;
      region?: string;
    };
  };
  parcel: {
    rowNumber?: number;
    cargoCategory: "parcel" | "documents" | "pallet";
    parcelDescription: string;
    insuranceCost: number;
    insuranceCurrencyCode?: string;
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
    customerNumber?: string;
    customerCreatedAt?: string;
    type?: "Invoice" | "ProformaInvoice";
    incoterm?: "DAP" | "DDP";
    exportReason?: "ForPersonalPurposes" | "Selling" | "Repair" | "Return" | "Other";
    payerFeesCustoms?: "Sender" | "Recipient" | "ThirdPerson";
    items?: Array<{
      id?: string;
      hsCode?: string;
      name?: string;
      nameEng?: string;
      materialEng?: string;
      madeInCountryCode?: string;
      measurementCode?: string;
      amount?: number;
      cost?: number;
      actualWeight?: number;
    }>;
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
  const senderAddressParts = asRecord(sender?.addressParts);
  const recipientAddressParts = asRecord(recipient?.addressParts);
  const senderDerivedAddress = [senderAddressParts?.street, senderAddressParts?.building]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(", ");
  const recipientDerivedAddress = [recipientAddressParts?.street, recipientAddressParts?.building]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(", ");

  return {
    postalServiceMode: mode,
    payerType: (data.payerType as ShipmentFormData["payerType"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.payerType,
    payerContractNumber: (data.payerContractNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.payerContractNumber,
    clientOrder: (data.clientOrder as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.clientOrder,
    note: (data.note as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.note,
    deliveryType: (data.deliveryType as ShipmentFormData["deliveryType"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.deliveryType,
    readyToShip: (data.readyToShip as boolean | undefined) ?? data.status === "ReadyToShip",
    status: data.status === "ReadyToShip" ? "ReadyToShip" : undefined,
    sender: {
      name: (sender?.name as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.name,
      phone: (sender?.phone as string | undefined)
        ? normalizeUaPhone(sender.phone as string)
        : DEFAULT_SHIPMENT_FORM_DATA.sender.phone,
      email: (sender?.email as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.email,
      countryCode: (sender?.countryCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.countryCode,
      companyTin: (sender?.companyTin as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.companyTin,
      companyName: (sender?.companyName as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.companyName,
      eoriCode: (sender?.eoriCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.eoriCode,
      divisionNumber: (sender?.divisionNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.sender.divisionNumber,
      city:
        (sender?.city as string | undefined) ??
        (senderAddressParts?.city as string | undefined) ??
        DEFAULT_SHIPMENT_FORM_DATA.sender.city,
      address:
        (sender?.address as string | undefined) ??
        senderDerivedAddress ||
        DEFAULT_SHIPMENT_FORM_DATA.sender.address,
      postalCode:
        (sender?.postalCode as string | undefined) ??
        (senderAddressParts?.postCode as string | undefined) ??
        DEFAULT_SHIPMENT_FORM_DATA.sender.postalCode,
      addressParts: senderAddressParts as ShipmentFormData["sender"]["addressParts"] | undefined,
    },
    recipient: {
      name: (recipient?.name as string | undefined) ?? (data.recipientName as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.name,
      phone: (recipient?.phone as string | undefined)
        ? normalizeUaPhone(recipient.phone as string)
        : (data.recipientPhone as string | undefined)
          ? normalizeUaPhone(data.recipientPhone as string)
          : DEFAULT_SHIPMENT_FORM_DATA.recipient.phone,
      email: (recipient?.email as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.email,
      countryCode: (recipient?.countryCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.countryCode,
      divisionNumber: (recipient?.divisionNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.recipient.divisionNumber,
      city:
        (recipient?.city as string | undefined) ??
        (recipientAddressParts?.city as string | undefined) ??
        DEFAULT_SHIPMENT_FORM_DATA.recipient.city,
      address:
        (recipient?.address as string | undefined) ??
        recipientDerivedAddress ||
        (data.deliveryAddress as string | undefined) ??
        DEFAULT_SHIPMENT_FORM_DATA.recipient.address,
      postalCode:
        (recipient?.postalCode as string | undefined) ??
        (recipientAddressParts?.postCode as string | undefined) ??
        DEFAULT_SHIPMENT_FORM_DATA.recipient.postalCode,
      addressParts: recipientAddressParts as ShipmentFormData["recipient"]["addressParts"] | undefined,
    },
    parcel: {
      rowNumber: parcel.rowNumber != null ? toFiniteNumber(parcel.rowNumber) : undefined,
      cargoCategory: ((parcel.cargoCategory as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.parcel.cargoCategory) as ShipmentFormData["parcel"]["cargoCategory"],
      parcelDescription: (parcel.parcelDescription as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.parcel.parcelDescription,
      insuranceCost: toFiniteNumber(parcel.insuranceCost, DEFAULT_SHIPMENT_FORM_DATA.parcel.insuranceCost),
      insuranceCurrencyCode: (parcel.insuranceCurrencyCode as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.parcel.insuranceCurrencyCode,
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
      customerNumber: (invoice?.customerNumber as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.customerNumber,
      customerCreatedAt: (invoice?.customerCreatedAt as string | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.customerCreatedAt,
      type: (invoice?.type as ShipmentFormData["invoice"]["type"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.type,
      incoterm: (invoice?.incoterm as ShipmentFormData["invoice"]["incoterm"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.incoterm,
      exportReason: (invoice?.exportReason as ShipmentFormData["invoice"]["exportReason"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.exportReason,
      payerFeesCustoms: (invoice?.payerFeesCustoms as ShipmentFormData["invoice"]["payerFeesCustoms"] | undefined) ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.payerFeesCustoms,
      items: Array.isArray(invoice?.items) ? (invoice.items as ShipmentFormData["invoice"]["items"]) : DEFAULT_SHIPMENT_FORM_DATA.invoice.items,
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
