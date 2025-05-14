import { Redirect } from "raviger";

import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceForm";

import { AppRoutes } from "@/Routers/AppRouter";
import AccountList from "@/pages/Facility/billing/account/AccountList";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";
import CreateInvoicePage from "@/pages/Facility/billing/account/CreateInvoice";
import InvoiceList from "@/pages/Facility/billing/invoice/InvoiceList";
import InvoiceShow from "@/pages/Facility/billing/invoice/InvoiceShow";
import PrintInvoice from "@/pages/Facility/billing/invoice/PrintInvoice";
import PaymentReconciliationList from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList";
import PaymentReconciliationShow from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationShow";
import PrintPaymentReconciliation from "@/pages/Facility/billing/paymentReconciliation/PrintPaymentReconciliation";
import { LocationLayout } from "@/pages/Facility/locations/LocationLayout";
import { FacilityOverview } from "@/pages/Facility/overview";
import FacilityServices from "@/pages/Facility/services/FacilityServices";
import HealthcareServiceShow from "@/pages/Facility/services/HealthcareServiceShow";
import DiagnosticReportPrint from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint";
import DiagnosticReportView from "@/pages/Facility/services/diagnosticReports/DiagnosticReportView";
import MedicationRequestList from "@/pages/Facility/services/pharmacy/MedicationRequestList";
import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";
import { SettingsLayout } from "@/pages/Facility/settings/layout";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <Redirect to="/" />,
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/settings*": ({ facilityId }) => (
    <SettingsLayout facilityId={facilityId} />
  ),
  "/facility/:facilityId/locations/:locationId*": ({
    facilityId,
    locationId,
  }) => <LocationLayout facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/services": ({ facilityId }) => (
    <FacilityServices facilityId={facilityId} />
  ),
  "/facility/:facilityId/services/:serviceId": ({ facilityId, serviceId }) => (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  ),
  "/facility/:facilityId/services/:serviceId/medication_requests/locations/:locationId":
    ({ facilityId, _serviceId, _locationId }) => (
      <MedicationRequestList facilityId={facilityId} />
    ),
  "/facility/:facilityId/services/:serviceId/requests/locations/:locationId": ({
    facilityId,
    serviceId,
    locationId,
  }) => (
    <ServiceRequestList
      facilityId={facilityId}
      serviceId={serviceId}
      locationId={locationId}
    />
  ),
  "/facility/:facilityId/services/:serviceId/requests/locations/:locationId/service_requests/:serviceRequestId":
    ({ facilityId, serviceId, locationId, serviceRequestId }) => (
      <ServiceRequestShow
        facilityId={facilityId}
        serviceId={serviceId}
        locationId={locationId}
        serviceRequestId={serviceRequestId}
      />
    ),
  "/facility/:facilityId/services_requests/:serviceRequestId": ({
    facilityId,
    serviceRequestId,
  }) => (
    <ServiceRequestShow
      facilityId={facilityId}
      serviceRequestId={serviceRequestId}
    />
  ),

  "/facility/:facilityId/diagnostic_reports/:diagnosticReportId": ({
    facilityId,
    diagnosticReportId,
  }) => (
    <DiagnosticReportView
      facilityId={facilityId}
      diagnosticReportId={diagnosticReportId}
    />
  ),
  "/facility/:facilityId/diagnostic_reports/:diagnosticReportId/print": ({
    facilityId,
    diagnosticReportId,
  }) => (
    <DiagnosticReportPrint
      facilityId={facilityId}
      diagnosticReportId={diagnosticReportId}
    />
  ),
  "/facility/:facilityId/billing/accounts": ({ facilityId }) => (
    <AccountList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/account/:accountId": ({
    facilityId,
    accountId,
  }) => (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="invoices" />
  ),
  "/facility/:facilityId/billing/account/:accountId/invoices": ({
    facilityId,
    accountId,
  }) => (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="invoices" />
  ),
  "/facility/:facilityId/billing/account/:accountId/charge_items": ({
    facilityId,
    accountId,
  }) => (
    <AccountShow
      facilityId={facilityId}
      accountId={accountId}
      tab="charge_items"
    />
  ),
  "/facility/:facilityId/billing/account/:accountId/payments": ({
    facilityId,
    accountId,
  }) => (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="payments" />
  ),
  "/facility/:facilityId/billing/account/:accountId/invoices/create": ({
    facilityId,
    accountId,
  }) => <CreateInvoicePage facilityId={facilityId} accountId={accountId} />,
  "/facility/:facilityId/billing/invoices": ({ facilityId }) => (
    <InvoiceList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/invoices/:invoiceId": ({
    facilityId,
    invoiceId,
  }) => <InvoiceShow facilityId={facilityId} invoiceId={invoiceId} />,
  "/facility/:facilityId/billing/invoice/:invoiceId/print": ({
    facilityId,
    invoiceId,
  }) => <PrintInvoice facilityId={facilityId} invoiceId={invoiceId} />,
  "/facility/:facilityId/billing/payments": ({ facilityId }) => (
    <PaymentReconciliationList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <PaymentReconciliationShow
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId/print": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <PrintPaymentReconciliation
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  ),
};

export default FacilityRoutes;
