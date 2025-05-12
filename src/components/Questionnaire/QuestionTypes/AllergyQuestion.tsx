import {
  CheckCircledIcon,
  CircleBackslashIcon,
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CATEGORY_ICONS } from "@/components/Patient/allergy/list";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import type { Code } from "@/types/base/code/code";
import {
  ALLERGY_VERIFICATION_STATUS,
  type AllergyIntolerance,
  type AllergyIntoleranceRequest,
  type AllergyVerificationStatus,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface AllergyQuestionProps {
  patientId: string;
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
}

const ALLERGY_INITIAL_VALUE: Partial<AllergyIntoleranceRequest> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  category: "medication",
  criticality: "low",
};

type AllergyCategory = "food" | "medication" | "environment" | "biologic";

const ALLERGY_CATEGORIES: Record<AllergyCategory, string> = {
  food: "Food",
  medication: "Medication",
  environment: "Environment",
  biologic: "Biologic",
};

function convertToAllergyRequest(
  allergy: AllergyIntolerance,
): AllergyIntoleranceRequest {
  return {
    id: allergy.id,
    code: allergy.code,
    clinical_status: allergy.clinical_status,
    verification_status: allergy.verification_status,
    category: allergy.category,
    criticality: allergy.criticality,
    last_occurrence: allergy.last_occurrence
      ? dateQueryString(new Date(allergy.last_occurrence))
      : undefined,
    note: allergy.note,
    encounter: allergy.encounter,
  };
}
interface AllergyTableRowProps {
  allergy: AllergyIntoleranceRequest;
  disabled?: boolean;
  onUpdate?: (allergy: Partial<AllergyIntoleranceRequest>) => void;
  onRemove?: () => void;
}

const AllergyTableRow = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
}: AllergyTableRowProps) => {
  const [showNotes, setShowNotes] = useState(allergy.note !== undefined);
  const { t } = useTranslation();
  return (
    <>
      <TableRow
        className={cn(
          allergy.verification_status === "entered_in_error" &&
            "opacity-40 pointer-events-none",
          allergy.clinical_status === "inactive" && "opacity-60",
          allergy.clinical_status === "resolved" && "line-through",
        )}
      >
        <TableCell className="py-1 pr-0">
          <Select
            value={allergy.category}
            onValueChange={(value: AllergyCategory) =>
              onUpdate?.({ category: value })
            }
            disabled={disabled || !!allergy.id}
          >
            <SelectTrigger className="h-8 md:h-9 w-[2rem] px-0 [&>svg]:hidden flex items-center justify-center">
              <SelectValue
                placeholder="Cat"
                className="text-center h-full flex items-center justify-center m-0 p-0"
              >
                {allergy.category && CATEGORY_ICONS[allergy.category]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(ALLERGY_CATEGORIES) as [
                  AllergyCategory,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[value]}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="font-medium py-1 pl-1">
          {allergy.code.display}
        </TableCell>
        <TableCell className="py-1">
          <Select
            value={allergy.criticality}
            onValueChange={(value) => onUpdate?.({ criticality: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 md:h-9">
              <SelectValue placeholder={t("critical")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("low")}</SelectItem>
              <SelectItem value="high">{t("high")}</SelectItem>
              <SelectItem value="unable_to_assess">
                {t("unable_to_assess")}
              </SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1">
          <Select
            value={allergy.verification_status}
            onValueChange={(value) => {
              onUpdate?.({
                verification_status: value as AllergyVerificationStatus,
              });
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 md:h-9">
              <SelectValue placeholder={t("verify")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ALLERGY_VERIFICATION_STATUS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1">
          <CombinedDatePicker
            value={
              allergy.last_occurrence
                ? new Date(allergy.last_occurrence)
                : undefined
            }
            onChange={(date) =>
              onUpdate?.({ last_occurrence: dateQueryString(date) })
            }
            disabled={disabled}
            buttonClassName="h-8 md:h-9 text-sm px-2 justify-start font-normal w-full"
          />
        </TableCell>
        <TableCell className="py-1 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="size-9"
              >
                <DotsVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowNotes((n) => !n)}>
                <Pencil2Icon className="size-4 mr-2" />
                {showNotes
                  ? t("hide_notes")
                  : allergy.note
                    ? t("show_notes")
                    : t("add_notes")}
              </DropdownMenuItem>
              {allergy.clinical_status !== "active" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "active" })}
                >
                  <CheckCircledIcon className="size-4 mr-2" />
                  {t("mark_active")}
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "inactive" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "inactive" })}
                >
                  <CircleBackslashIcon className="size-4 mr-2" />
                  {t("mark_inactive")}
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "resolved" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "resolved" })}
                >
                  <CheckCircledIcon className="size-4 mr-2 text-green-600" />
                  {t("mark_resolved")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="size-4 mr-2" />
                {t("remove_allergy")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={6} className="px-4 py-2">
            <Input
              type="text"
              placeholder={t("add_notes_about_the_allergy")}
              value={allergy.note ?? ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              className="mt-0.5"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
export function AllergyQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
}: AllergyQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const allergies =
    (questionnaireResponse.values?.[0]?.value as AllergyIntoleranceRequest[]) ||
    [];
  const isMobile = useBreakpoints({ default: true, md: false });

  const { data: patientAllergies } = useQuery({
    queryKey: ["allergies", patientId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientAllergies?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: patientAllergies.results.map(convertToAllergyRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientAllergies]);

  const handleAddAllergy = (code: Code) => {
    const newAllergies = [
      ...allergies,
      { ...ALLERGY_INITIAL_VALUE, code },
    ] as AllergyIntoleranceRequest[];
    updateQuestionnaireResponseCB(
      [{ type: "allergy_intolerance", value: newAllergies }],
      questionnaireResponse.question_id,
    );
  };

  const handleRemoveAllergy = (index: number) => {
    const allergy = allergies[index];
    if (allergy.id) {
      // For existing records, update verification status to entered_in_error
      const newAllergies = allergies.map((a, i) =>
        i === index
          ? { ...a, verification_status: "entered_in_error" as const }
          : a,
      ) as AllergyIntoleranceRequest[];
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: newAllergies,
          },
        ],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newAllergies = allergies.filter((_, i) => i !== index);
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: newAllergies,
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  };

  const handleUpdateAllergy = (
    index: number,
    updates: Partial<AllergyIntoleranceRequest>,
  ) => {
    const newAllergies = allergies.map((allergy, i) =>
      i === index ? { ...allergy, ...updates } : allergy,
    );
    updateQuestionnaireResponseCB(
      [{ type: "allergy_intolerance", value: newAllergies }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-2">
      {allergies.length > 0 && (
        <div className="rounded-lg border border-gray-200">
          {/* Desktop View - Table */}
          {!isMobile && (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[10%] max-w-[3rem]"></TableHead>
                  <TableHead className="w-[40%]">{t("substance")}</TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("criticality")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("occurrence")}
                  </TableHead>
                  <TableHead className="w-[5%] text-center">
                    {t("action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((allergy, index) => (
                  <AllergyTableRow
                    key={index}
                    allergy={allergy}
                    disabled={disabled}
                    onUpdate={(updates) => handleUpdateAllergy(index, updates)}
                    onRemove={() => handleRemoveAllergy(index)}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-200">
            {allergies.map((allergy, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 space-y-3",
                  allergy.verification_status === "entered_in_error" &&
                    "opacity-40 pointer-events-none",
                  allergy.clinical_status === "inactive" && "opacity-60",
                  allergy.clinical_status === "resolved" && "line-through",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={allergy.category}
                      onValueChange={(value: AllergyCategory) =>
                        handleUpdateAllergy(index, { category: value })
                      }
                      disabled={disabled || !!allergy.id}
                    >
                      <SelectTrigger className="h-8 w-[2rem] px-0 [&>svg]:hidden flex items-center justify-center">
                        <SelectValue>
                          {allergy.category && CATEGORY_ICONS[allergy.category]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(ALLERGY_CATEGORIES) as [
                            AllergyCategory,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              {CATEGORY_ICONS[value]}
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="font-medium">{allergy.code.display}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="size-8"
                      >
                        <DotsVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateAllergy(index, {
                            note: allergy.note !== undefined ? undefined : "",
                          })
                        }
                      >
                        <Pencil2Icon className="size-4 mr-2" />
                        {allergy.note !== undefined
                          ? "Hide Notes"
                          : "Add Notes"}
                      </DropdownMenuItem>
                      {allergy.clinical_status !== "active" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "active",
                            })
                          }
                        >
                          <CheckCircledIcon className="size-4 mr-2" />
                          {t("mark_active")}
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "inactive" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "inactive",
                            })
                          }
                        >
                          <CircleBackslashIcon className="size-4 mr-2" />
                          {t("mark_inactive")}
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "resolved" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "resolved",
                            })
                          }
                        >
                          <CheckCircledIcon className="size-4 mr-2 text-green-600" />
                          {t("mark_resolved")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveAllergy(index)}
                      >
                        <MinusCircledIcon className="size-4 mr-2" />
                        {t("remove_allergy")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("criticality")}
                    </Label>
                    <Select
                      value={allergy.criticality}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, { criticality: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Critical" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="unable_to_assess">
                          Unable to Assess
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("status")}
                    </Label>
                    <Select
                      value={allergy.verification_status}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, {
                          verification_status:
                            value as AllergyVerificationStatus,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Verify" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLERGY_VERIFICATION_STATUS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("occurrence")}
                    </Label>

                    <CombinedDatePicker
                      value={
                        allergy.last_occurrence
                          ? new Date(allergy.last_occurrence)
                          : undefined
                      }
                      onChange={(date) =>
                        handleUpdateAllergy(index, {
                          last_occurrence: dateQueryString(date),
                        })
                      }
                      disabled={disabled}
                      buttonClassName="h-7 text-sm px-2 justify-start font-normal w-full"
                    />
                  </div>
                </div>

                {allergy.note !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("notes")}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Add notes about the allergy..."
                      value={allergy.note ?? ""}
                      onChange={(e) =>
                        handleUpdateAllergy(index, { note: e.target.value })
                      }
                      disabled={disabled}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ValueSetSelect
        system="system-allergy-code"
        placeholder={t("search_for_allergies_to_add")}
        onSelect={handleAddAllergy}
        disabled={disabled}
      />
    </div>
  );
}
