import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";
import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";
import ReportBuilderList from "@/pages/Encounters/ReportBuilder";
import ReportBuilder from "@/pages/Encounters/ReportBuilder/ReportBuilder";
import { BillingSettingsLayout } from "@/pages/Facility/settings/billing/layout";
import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";
import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";
import DevicesList from "@/pages/Facility/settings/devices/DevicesList";
import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";
import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";
import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

import ActivityDefinitionForm from "./activityDefinition/ActivityDefinitionForm";
import ActivityDefinitionList from "./activityDefinition/ActivityDefinitionList";
import ActivityDefinitionView from "./activityDefinition/ActivityDefinitionView";
import { ChargeItemDefinitionDetail } from "./chargeItemDefinitions/ChargeItemDefinitionDetail";
import { ChargeItemDefinitionsList } from "./chargeItemDefinitions/ChargeItemDefinitionsList";
import { CreateChargeItemDefinition } from "./chargeItemDefinitions/CreateChargeItemDefinition";
import { UpdateChargeItemDefinition } from "./chargeItemDefinitions/UpdateChargeItemDefinition";
import { GeneralSettings } from "./general/general";
import HealthcareServiceForm from "./healthcareService/HealthcareServiceForm";
import HealthcareServiceList from "./healthcareService/HealthcareServiceList";
import HealthcareServiceShow from "./healthcareService/HealthcareServiceShow";
import LocationSettings from "./locations/LocationSettings";
import ObservationDefinitionForm from "./observationDefinition/ObservationDefinitionForm";
import ObservationDefinitionList from "./observationDefinition/ObservationDefinitionList";
import ObservationDefinitionView from "./observationDefinition/ObservationDefinitionView";
import FacilityOrganizationList from "./organizations/FacilityOrganizationList";
import ProductForm from "./product/ProductForm";
import ProductList from "./product/ProductList";
import ProductView from "./product/ProductView";
import ProductKnowledgeForm from "./productKnowledge/ProductKnowledgeForm";
import ProductKnowledgeList from "./productKnowledge/ProductKnowledgeList";
import ProductKnowledgeView from "./productKnowledge/ProductKnowledgeView";
import { CreateSpecimenDefinition } from "./specimen-definitions/CreateSpecimenDefinition";
import { SpecimenDefinitionDetail } from "./specimen-definitions/SpecimenDefinitionDetail";
import { SpecimenDefinitionsList } from "./specimen-definitions/SpecimenDefinitionsList";
import { UpdateSpecimenDefinition } from "./specimen-definitions/UpdateSpecimenDefinition";
import TokenCategoryForm from "./tokenCategory/TokenCategoryForm";
import TokenCategoryList from "./tokenCategory/TokenCategoryList";
import TokenCategoryView from "./tokenCategory/TokenCategoryView";

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/departments": () => <FacilityOrganizationList />,
  "/departments/:id/:tab": ({ id, tab }: { id: string; tab: string }) => (
    <FacilityOrganizationList organizationId={id} currentTab={tab} />
  ),
  "/locations": () => <LocationSettings facilityId={facilityId} />,
  "/locations/:id": ({ id }: { id: string }) => (
    <LocationSettings facilityId={facilityId} locationId={id} />
  ),
  "/devices": () => <DevicesList facilityId={facilityId} />,
  "/devices/create": () => <CreateDevice facilityId={facilityId} />,
  "/devices/:id": ({ id }: { id: string }) => (
    <DeviceDetail facilityId={facilityId} deviceId={id} />
  ),
  "/devices/:id/edit": ({ id }: { id: string }) => (
    <UpdateDevice facilityId={facilityId} deviceId={id} />
  ),
  "/specimen_definitions": () => (
    <SpecimenDefinitionsList facilityId={facilityId} />
  ),
  "/specimen_definitions/create": () => (
    <CreateSpecimenDefinition facilityId={facilityId} />
  ),
  "/specimen_definitions/new": () => (
    <CreateSpecimenDefinition facilityId={facilityId} />
  ),
  "/specimen_definitions/:id": ({ id }: { id: string }) => (
    <SpecimenDefinitionDetail
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/specimen_definitions/:id/edit": ({ id }: { id: string }) => (
    <UpdateSpecimenDefinition
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/observation_definitions": () => (
    <ObservationDefinitionList facilityId={facilityId} />
  ),
  "/observation_definitions/new": () => (
    <ObservationDefinitionForm facilityId={facilityId} />
  ),
  "/observation_definitions/:id/edit": ({ id }: { id: string }) => (
    <ObservationDefinitionForm
      facilityId={facilityId}
      observationDefinitionId={id}
    />
  ),
  "/observation_definitions/:id": ({ id }: { id: string }) => (
    <ObservationDefinitionView
      facilityId={facilityId}
      observationDefinitionId={id}
    />
  ),
  "/activity_definitions": () => (
    <ActivityDefinitionList facilityId={facilityId} />
  ),
  "/activity_definitions/categories/:categorySlug": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ActivityDefinitionList
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  ),
  "/activity_definitions/categories/:categorySlug/new": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ActivityDefinitionForm
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  ),
  "/activity_definitions/new": () => (
    <ActivityDefinitionForm facilityId={facilityId} />
  ),
  "/activity_definitions/:id": ({ id }: { id: string }) => (
    <ActivityDefinitionView facilityId={facilityId} activityDefinitionId={id} />
  ),
  "/activity_definitions/:id/edit": ({ id }: { id: string }) => (
    <ActivityDefinitionForm facilityId={facilityId} activityDefinitionId={id} />
  ),
  "/healthcare_services": () => (
    <HealthcareServiceList facilityId={facilityId} />
  ),
  "/healthcare_services/new": () => (
    <HealthcareServiceForm facilityId={facilityId} />
  ),
  "/healthcare_services/:id": ({ id }: { id: string }) => (
    <HealthcareServiceShow facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/healthcare_services/:id/edit": ({ id }: { id: string }) => (
    <HealthcareServiceForm facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/billing*": () => <BillingSettingsLayout />,
  "/charge_item_definitions": () => (
    <ChargeItemDefinitionsList facilityId={facilityId} />
  ),
  "/charge_item_definitions/categories/:slug": ({ slug }: { slug: string }) => (
    <ChargeItemDefinitionsList facilityId={facilityId} categorySlug={slug} />
  ),
  "/charge_item_definitions/categories/:slug/new": ({
    slug,
  }: {
    slug: string;
  }) => (
    <CreateChargeItemDefinition facilityId={facilityId} categorySlug={slug} />
  ),
  "/charge_item_definitions/:slug": ({ slug }: { slug: string }) => (
    <ChargeItemDefinitionDetail facilityId={facilityId} slug={slug} />
  ),
  "/charge_item_definitions/:slug/edit": ({ slug }: { slug: string }) => (
    <UpdateChargeItemDefinition facilityId={facilityId} slug={slug} />
  ),
  "/product_knowledge": () => <ProductKnowledgeList facilityId={facilityId} />,
  "/product_knowledge/categories/:categorySlug": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ProductKnowledgeList facilityId={facilityId} categorySlug={categorySlug} />
  ),
  "/product_knowledge/categories/:categorySlug/new": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ProductKnowledgeForm facilityId={facilityId} categorySlug={categorySlug} />
  ),
  "/product_knowledge/:slug": ({ slug }: { slug: string }) => (
    <ProductKnowledgeView facilityId={facilityId} slug={slug} />
  ),
  "/product_knowledge/:slug/edit": ({ slug }: { slug: string }) => (
    <ProductKnowledgeForm facilityId={facilityId} slug={slug} />
  ),
  "/product": () => <ProductList facilityId={facilityId} />,
  "/product/new": () => <ProductForm facilityId={facilityId} />,
  "/product/:id": ({ id }: { id: string }) => (
    <ProductView facilityId={facilityId} productId={id} />
  ),
  "/product/:id/edit": ({ id }: { id: string }) => (
    <ProductForm facilityId={facilityId} productId={id} />
  ),
  "/token_category": () => <TokenCategoryList facilityId={facilityId} />,
  "/token_category/new": () => <TokenCategoryForm facilityId={facilityId} />,
  "/token_category/:id": ({ id }: { id: string }) => (
    <TokenCategoryView facilityId={facilityId} tokenCategoryId={id} />
  ),
  "/token_category/:id/edit": ({ id }: { id: string }) => (
    <TokenCategoryForm facilityId={facilityId} tokenCategoryId={id} />
  ),

  "/reportbuilder": () => <ReportBuilderList facilityId={facilityId} />,
  "/reportbuilder/new": () => <ReportBuilder facilityId={facilityId} />,
  "/reportbuilder/:reportTemplateId": ({
    reportTemplateId,
  }: {
    reportTemplateId: string;
  }) => (
    <ReportBuilder
      facilityId={facilityId}
      reportTemplateId={reportTemplateId}
    />
  ),
  "/patient_identifier_config": () => (
    <PatientIdentifierConfigList facilityId={facilityId} />
  ),
  "/patient_identifier_config/new": () => (
    <PatientIdentifierConfigForm facilityId={facilityId} />
  ),
  "/patient_identifier_config/:id": ({ id }: { id: string }) => (
    <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />
  ),
  "/patient_identifier_config/:id/edit": ({ id }: { id: string }) => (
    <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />
  ),
  "/tag_config": () => <TagConfigList facilityId={facilityId} />,
  "/tag_config/:tagId": ({ tagId }: { tagId: string }) => (
    <TagConfigView facilityId={facilityId} tagId={tagId} />
  ),
  "*": () => <ErrorPage />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const basePath = `/facility/${facilityId}/settings`;
  const routeResult = useRoutes(getRoutes(facilityId), {
    basePath,
    routeProps: {
      facilityId,
    },
  });

  return <div className="container mx-auto p-4">{routeResult}</div>;
}
