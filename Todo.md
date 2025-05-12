# Todo

Do keep this updated if you have completed something, also mark your name to the issue if you have working on something.

x : Done

- : In Progress/Assigned/Blocked

## Pharmacy

- [ ] Clean up product knowledge and fix update
- [ ] Clean up product and support edit form product knowledge

## Billing

- [-] Replace Charge Item Create with ChargeItemDef to ChargeItem API - Vignesh
- [-] All instance level tax codes should be shown as an option in the charge item def creator - Check with Vignesh
- [-] Add support for information components in chargeDef and Charge Item. - Rithvik
- [-] Consider disabling onWheelChange for input[type=number] fields. - [hold till @bodhi confirms]
- [-] When Creating charge item in questionnaire we should allow users to pick discount and tax and quantitiy. - Amjith
- [x] When Creating charge item in questionnaire we should display applicable discounts and tax and amounts from the charge item def as read-only - Yaswanth

## Labs

- [ ] Print all Barcodes button for a service request with page setup
- [-] Add support for multiple diagnostic report for a service request - [hold till @bodhi confirms]
- [-] Service Request - Show specimen.collection.collector details instead of UUID (After BE change) - Vignesh
- [-] Service Request - Show specimen.processing.performer details instead of UUID (After BE change) - Vignesh
- [ ] Service request should show linked cahrge items along with its status [check for backend support]

## Back End

- [ ] Service Request - Show specimen.collection.collector details instead of UUID (After BE change)
- [ ] Service Request - Show specimen.processing.performer details instead of UUID (After BE change)
- [ ] Patient - There shouldn't be more than one active account at any point in time
- [ ] BE need to sort by internal id by default, all apis has jumping issue
- [ ] Need sort by payment_datetime for Payment Reconciliation list
- [ ] Replace Charge Item Create with ChargeItemDef to ChargeItem API
- [ ] Add support for information codes (such as MRP)
- [ ] Disallow same code for the same component type in Charge Item's pricing components (https://github.com/ohcnetwork/care/pull/3033) - Rithvik

# Archived

## Billing

- [x] Wire the actual amounts in all payment pages once backend is done - Amjith
- [x] Make currency configurable - Rithvik
- [x] Add paymenthistory in invoices page - Amjith
- [x] Account - Record payment without invoice - Jeevan
- [x] Account balance
- [x] Invoice list cleanup - Amjith
- [x] Invoice View cleanup - Amjith
- [x] Invoice Print Screen - Amjith
- [x] Invoice - Show record payment button only when in issued status - Jeevan
- [x] Invoice - Show Issue Invoice button when in draft status - Jeevan
- [x] Invoice - Remove status dropdown in Invoice create & edit - Jeevan
- [x] Invoice - Balance Invoice button - Confirm popup - Jeevan
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
- [x] Charge Item Definition Update - Rithvik
- [x] Invoice - Entered in error in action menu - Jeevan
- [x] [!BUG!] Charge Item create is broken now. - Amjith (Data Issue)
- [x] We should also make it billable by deafault - Amjith
- [x] We should only show active charge defanitions in questionnaire - Manyu & Rithvik
- [x] Description and Purpose (Additional Details) for a charge item def should be above the price component - Manyu
- [x] Lets have a list like styling for the discount codes as their would be a lot of these options. - Rithvik
- [x] The UX for creating a new code should be better, the flow is quite ambigious to pick one. - Rithvik
- [x] We should also show instance level tax components in the billing page - Rithvik
- [x] Charge Item Update - Jeevan & Rithvik
- [x] Build a flow for account balanceing and closing (Close button - mark as inactive and select close reason dropdown) - Jeevan
- [x] Allow serch for discount codes - Rithvik

## Labs

- [x] Build service request list page based on design - Manyu
- [x] Rewamp design of service request show page based on design - Yaswanth
- [x] Add support for search by specimen ID in the UI based on design - Manyu
- [x] Add filters for statues in service request page as of the UI - Manyu
- [x] Add support for xray and file uploads service request - Amjith
- [x] [!BUG!] Specimen Discard broken - Hide from SR after discard, should be able to collect the same specimen again - Yaswanth
- [x] Currently when ever we interact with discard specimen dialog the below specimen collapsible is getting expanded and collapsed. This should not happen. - Yaswanth
- [x] Implement barcode in service request after creating the Specimen - Manyu & Amjith
- [x] In service request create from AD lets remove status, intent, category, do not perform and locations. (These should be shown along with the name for information purpose) - Manyu
- [x] If no specimen def is avilable then lets not empty state - Amjith
- [x] Lets move uploaded files list to above the Choose file Card - Yash
- [x] Diagnostic Report - Print uploaded files as well - Yash
- [x] When you have uploaded the file the result section should always be present. - Yash
- [x] Link to diganostic report page should be added to the service request - Yash
- [x] We should have an option to capture conclusion in diagnostic report- Yash
- [x] Workflow statuses on the right side as per design should be created. - Amjith
- [x] Move the workflow progress into a sheet for small devices - Yaswanth
- [x] Hide the sidebar on SR show - (Sugegstion from Vinu) - Yaswanth
- [x] Show the specimen history inside a sheet on SR show - Yaswanth
- [x] [!BUG!] Allow re-creating the draft specimen after discrard - when the specimen is not in available or draft status - Yaswanth
