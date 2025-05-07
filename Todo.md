# Todo

Do keep this updated if you have completed something, also mark your name to the issue if you have working on something.

x : Done

- : In Progress/Assigned/Blocked

## Billing

- [x] Wire the actual amounts in all payment pages once backend is done - Amjith
- [ ] Make currency configurable
- [x] Add paymenthistory in invoices page - Amjith
- [-] Add payment as transactions tab in account page - Jeevan
- [ ] Build a flow for account balanceing and closing
- [ ] Make it easy for users to mark an invoice as issued from draft state
- [-] Replace Charge Item Create with ChargeItemDef to ChargeItem API - Vignesh
- [x] Account balance
- [x] Invoice list cleanup - Amjith
- [x] Invoice View cleanup - Amjith
- [x] Invoice Print Screen - Amjith
- [ ] Invoice update statuses - Call different APIs
- [x] Invoice - Add charge items when draft - Jeevan
- [x] Invoice - Payment history filter by invoice - Amjith
- [x] Account - Payments tab - filter by Account - BE
- [x] Invoice View & Print - Show tax split up & Discounts (code with group in brackets) - Amjith
- [x] Invoice - Cancel button (API) & Mark as entered-in-error - Jeevan
- [x] View for Cancelled invoices list (Tab - by invoice Status) - Jeevan
- [x] Charge items list (Tab - by Charge item Status) - Jeevan
- [x] Payments list (Tab - by Charge item Status) - Jeevan
- [x] Show page for cancelled invoice (render charge items from cache)
- [x] Create invoice inside Account charge item list - Jeevan
- [-] Charge Item Definition Update - Rithvik
- [-] Charge Item Update - Jeevan & Rithvik

## Labs

- [x] Build service request list page based on design - Manyu
- [x] Rewamp design of service request show page based on design - Yaswanth
- [-] Add support for search by specimen ID in the UI based on design - Manyu
- [x] Add filters for statues in service request page as of the UI - Manyu
- [-] Add support for multiple diagnostic report for a service request - [hold till @bodhi confirms]
- [-] Service Request - Show specimen.collection.collector details instead of UUID (After BE change) - Vignesh
- [-] Service Request - Show specimen.processing.performer details instead of UUID (After BE change) - Vignesh
- [x] Add support for xray and file uploads service request - Amjith

- [-] In service request create from AD lets remove status, intent, category, do not perform and locations. (These should be shown along with the name for information purpose) - Manyu
- [x] If no specimen def is avilable then lets not empty state - Amjith
- [x] Lets move uploaded files list to above the Choose file Card - Yash
- [ ] Implement barcode in service request after creating the Specimen
- [-] Print all Barcodes button for a service request with page setup - [hold till @bodhi confirms]
- [-] When you have uploaded the file the result section should always be present. - Yash
- [x] Link to diganostic report page should be added to the service request - Yash
- [x] We should have an option to capture conclusion in diagnostic report- Yash
- [ ] workflow statuses on the right side as per design should be created.
- [ ] Service request should show linked cahrge items along with its status [check for backend support]
- [ ] Diagnostic Report - Print uploaded files as well - Yash

## Back End

- [ ] Service Request - Show specimen.collection.collector details instead of UUID (After BE change)
- [ ] Service Request - Show specimen.processing.performer details instead of UUID (After BE change)
- [ ] Patient - There shouldn't be more than one active account at any point in time
- [ ] BE need to sort by internal id by default, all apis has jumping issue
- [ ] Need sort by payment_datetime for Payment Reconciliation list
- [ ] Replace Charge Item Create with ChargeItemDef to ChargeItem API
