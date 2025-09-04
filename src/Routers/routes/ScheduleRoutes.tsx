import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { Redirect } from "raviger";

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": () => (
    <AppointmentsPage resourceType={SchedulableResourceType.Practitioner} />
  ),

  "/facility/:facilityId/patient/:patientId/book-appointment": ({
    patientId,
  }) => <BookAppointment patientId={patientId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    appointmentId,
  }) => <AppointmentDetail appointmentId={appointmentId} />,

  "/facility/:facilityId/queues": ({ facilityId }) => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
    />
  ),

  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId": ({
    facilityId,
    practitionerId,
    queueId,
  }) => (
    <Redirect
      to={`/facility/${facilityId}/queues/${queueId}/practitioner/${practitionerId}/ongoing`}
    />
  ),

  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId/ongoing":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="ongoing"
      />
    ),
  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId/completed":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="completed"
      />
    ),
};

export default ScheduleRoutes;
