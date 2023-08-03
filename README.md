# Summary
Automatically creates and deletes 15min appointments around changed Google Calendar events to allow for leeway

# Description
The trigger script searches for changed Calendar appointments and determines which were added and removed.
Next, blockers are added before and after the added events and removed from the removed events 
(unless the blocker is adjacent to another appointment, in which case it is kept).

A syncToken is kept in a separate sheet to keep track of the Calendar state and allow for incremental updates.

# Setup

1. Create required files
	1. Create a new project at https://script.google.com/ 
	1. Create a new Google Sheet (to save calendar state) and note the hash ID (from the hyperlink)
1. Update the script
	1. Activate the `Google Calendar API` Service under the Services menu (From the left menu in the Editor)
	1. Copy the script from the `Code.gs` file to your open script
	1. Enter the hash ID previously noted in this script as VARIABLES_SHEET_ID (quoted)
1. Set up the script functionality
	1. Run the resetToken() function by selecting it from the dropdown menu and clicking `run` to write the intial syncToken to above mentioned sheet.
	1. Create a `Calendar Upated` trigger for `whenUpdated()` from the Triggers menu

# Resources
* [Google App Script reference](https://developers.google.com/apps-script/guides/triggers/events#google_calendar_events)
* [Incremental Calendar Sync](https://developers.google.com/calendar/api/guides/sync#incremental_sync)
