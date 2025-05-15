import { ProductRead } from "@/types/inventory/product/product";
import { LocationList } from "@/types/location/location";

export type InventoryStatus = "active" | "inactive" | "entered_in_error";

interface InventoryBase {
  status: InventoryStatus;
}

export interface InventoryRead extends InventoryBase {
  id: string;
  net_content: number;
  product: ProductRead;
}

export interface InventoryRetrieve extends InventoryRead {
  location: LocationList;
}

export type InventoryWrite = InventoryBase;
