import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

export interface TokenCategory {
  id: string;
  name: string;
  resource_type: SchedulableResourceType;
  shorthand: string;
}

export type TokenCategoryCreate = Omit<TokenCategory, "id">;

export type TokenCategoryRead = TokenCategory;

export interface TokenCategoryUpdate {
  name: string;
}

export interface TokenCategoryRetrieveSpec extends TokenCategoryRead {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}
