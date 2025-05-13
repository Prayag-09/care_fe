import careConfig from "@careConfig";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SpecimenRead } from "@/types/emr/specimen/specimen";

interface MultiQRCodePrintSheetProps {
  specimens: SpecimenRead[];
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MultiQRCodePrintSheet({
  specimens,
  children,
  open,
  onOpenChange,
}: MultiQRCodePrintSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSpecimens, setSelectedSpecimens] = useState<Set<string>>(
    new Set(),
  );
  const [localSpecimens, setLocalSpecimens] =
    useState<SpecimenRead[]>(specimens);
  const [isPrintView, setIsPrintView] = useState(false);

  // Calculate logo size as 25% of QR code size
  const qrCodeSize = 120;
  const logoSize = Math.floor(qrCodeSize * 0.25);
  const printSize = 80;

  // Update local specimens when props change
  useEffect(() => {
    setLocalSpecimens(specimens);
    // Auto-select all specimens when they are updated/created
    if (specimens.length > 0 && selectedSpecimens.size === 0) {
      setSelectedSpecimens(new Set(specimens.map((s) => s.id)));
    }
  }, [specimens]);

  // Handle controlled open state
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const toggleSpecimen = (specimenId: string) => {
    const newSelected = new Set(selectedSpecimens);
    if (newSelected.has(specimenId)) {
      newSelected.delete(specimenId);
    } else {
      newSelected.add(specimenId);
    }
    setSelectedSpecimens(newSelected);
  };

  const selectAll = () => {
    const allIds = localSpecimens.map((specimen) => specimen.id);
    setSelectedSpecimens(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedSpecimens(new Set());
  };

  const handlePrint = () => {
    // Switch to print view and close the sheet
    setIsPrintView(true);
    handleOpenChange(false);
  };

  // Get selected specimen data for print view
  const selectedSpecimenData = Array.from(selectedSpecimens)
    .map((id) => localSpecimens.find((s) => s.id === id))
    .filter(Boolean) as SpecimenRead[];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("print_qr_codes")}</SheetTitle>
          </SheetHeader>

          <div className="flex items-center justify-between my-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {t("select_all")}
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                {t("clear_selection")}
              </Button>
            </div>
            <Button
              disabled={selectedSpecimens.size === 0}
              onClick={handlePrint}
            >
              <CareIcon icon="l-print" className="mr-2 h-4 w-4" />
              {t("print_selected")}
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-4">
              {localSpecimens.map((specimen) => (
                <div
                  key={specimen.id}
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`specimen-${specimen.id}`}
                      checked={selectedSpecimens.has(specimen.id)}
                      onCheckedChange={() => toggleSpecimen(specimen.id)}
                    />
                    <div className="flex flex-1 justify-between items-start">
                      <div className="space-y-1">
                        <label
                          htmlFor={`specimen-${specimen.id}`}
                          className="text-base font-medium cursor-pointer"
                        >
                          {specimen.specimen_type?.display || t("specimen")}
                        </label>
                        <div className="text-sm text-gray-500">
                          {specimen.specimen_definition?.title}
                        </div>
                        <div className="text-xs text-gray-700 font-medium uppercase mt-1">
                          {specimen.id}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="capitalize bg-green-50 text-green-700"
                      >
                        {specimen.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <QRCodeSVG
                      value={specimen.id}
                      size={qrCodeSize}
                      className="bg-white mx-auto"
                      imageSettings={{
                        src: "/images/care_logo_mark.svg",
                        height: logoSize,
                        width: logoSize,
                        excavate: true,
                      }}
                      level="H"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isPrintView} onOpenChange={setIsPrintView}>
        <DialogContent className="min-w-4xl overflow-x-auto">
          <PrintPreview title={t("qr_codes")}>
            <div className="space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                      {t("qr_codes")}
                    </h2>
                  </div>
                </div>
                <img
                  src={careConfig.mainLogo?.dark}
                  alt="Care Logo"
                  className="h-10 w-auto object-contain ml-6"
                />
              </div>

              {/* QR Codes Grid */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {selectedSpecimenData.map((specimen) => (
                  <div key={specimen.id} className="page-break-inside-avoid">
                    <div className="flex gap-6 p-4 border border-gray-200 rounded-lg">
                      <div className="shrink-0">
                        <QRCodeSVG
                          value={specimen.id}
                          size={printSize}
                          className="bg-white"
                          imageSettings={{
                            src: "/images/care_logo_mark.svg",
                            height: logoSize,
                            width: logoSize,
                            excavate: true,
                          }}
                          level="H"
                        />
                      </div>
                      <div>
                        {specimen.specimen_type?.display && (
                          <div className="text-lg font-semibold pt-2.5">
                            {specimen.specimen_type.display}
                          </div>
                        )}
                        {specimen.specimen_definition?.title && (
                          <div className="text-sm text-gray-600">
                            {specimen.specimen_definition.title}
                          </div>
                        )}
                        {specimen.id && (
                          <div className="font-semibold uppercase text-sm text-gray-700">
                            {specimen.id}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 space-y-1 pt-2 text-[10px] text-gray-500 flex justify-between">
                <p>
                  {t("generated_on")} {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </PrintPreview>
        </DialogContent>
      </Dialog>
    </>
  );
}
