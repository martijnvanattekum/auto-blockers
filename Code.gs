// CONSTANTS //
const VARIABLES_SHEET_ID = "" // ID for any existing sheet to keep the syncToken in
const CALENDAR_ID = 'primary'
const BLOCKER_TITLE = 'Flexible autoblocker' // Calender title for the blockers
const BLOCKER_TIME = 15 // time for the blockers in minutes


// TRIGGER FUNCTION -- create a "Calendar Upated" trigger for this function //
function whenUpdated(e){
  
  const calendar = CalendarApp.getDefaultCalendar()
  
  const lastSyncToken = readLastSyncToken()
  const new_events = retrieveEvents(calendarId = CALENDAR_ID, syncToken = lastSyncToken)
  const nextSyncToken = new_events["nextSyncToken"]
   
  const items = new_events["items"].filter(item => item["summary"] !== BLOCKER_TITLE) // remove blockers from items to avoid infinite trigger loop!!
  const added_items = items.filter(item => item["status"] !== "cancelled")
  const removed_items = items.filter(item => item["status"] === "cancelled")

  added_items.forEach(item => addBlockers(calendar, item["id"]))
  removed_items.forEach(item => removeBlockers(calendar, item["id"]))

  writeSyncToken(sheet_name = "variables", cell = "B2", value = nextSyncToken) 
  console.log("The following " + items.length + " items have been updated\n" + items)

}


// GENERAL CALENDAR FUNCTIONS //
function subtractMinutes(time, minutes){return new Date(new Date(time).setMinutes(time.getMinutes() - minutes))}
function addMinutes(time, minutes){return new Date(new Date(time).setMinutes(time.getMinutes() + minutes))}
function anyEventsDuring(calendar, startTime, endTime){return calendar.getEvents(startTime, endTime).length !== 0}

function retrieveEvents(calendarId = CALENDAR_ID, sync_token = null){
  // Retrieves all events from calendar with calendarId in JSON-like format. 
  // When syncToken is provided, only events created after syncToken was generated will be retrieved
  // When events are paginated, only the last page (including the syncToken) is returned

  events = Calendar.Events.list(calendarId, {syncToken : sync_token})
  while ("nextPageToken" in events){
    console.log("Browsing Pages")
    nextPageToken = events["nextPageToken"]
    events = Calendar.Events.list(calendarId, {pageToken : nextPageToken}) 
  }
  return events

}


// CALCULATIONS FOR BLOCKER EVENTS //
function calculateBlockerTimes(calendar, event_id, duration = BLOCKER_TIME){
  // returns object containing the (anticipated) blocker times for event with event_id

  const calendar_event = calendar.getEventById(event_id)

  const pre_blocker_end = calendar_event.getStartTime()
  const pre_blocker_start = subtractMinutes(pre_blocker_end, duration)
  const post_blocker_start = calendar_event.getEndTime()
  const post_blocker_end = addMinutes(post_blocker_start, duration)
  
  const blocker_times = {
    pre: {start: pre_blocker_start, end: pre_blocker_end},
    post: {start: post_blocker_start, end: post_blocker_end}
  }

  return blocker_times

}

function addBlockers(calendar, event_id, title = BLOCKER_TITLE, duration = BLOCKER_TIME){
  // adds a blocker with 'title' and of 'duration' (in minutes) before and after event with 'event_id'
  
  blocker_times = calculateBlockerTimes(calendar, event_id)

  // add blocker events if calendar space is empty
  if (!anyEventsDuring(calendar, blocker_times.pre.start, blocker_times.pre.end)){
    calendar.createEvent(title, blocker_times.pre.start, blocker_times.pre.end)}
  if (!anyEventsDuring(calendar, blocker_times.post.start, blocker_times.post.end)){
    calendar.createEvent(title, blocker_times.post.start, blocker_times.post.end)}

}

function removeBlockers(calendar, event_id, title = BLOCKER_TITLE, duration = BLOCKER_TIME){
  
  blocker_times = calculateBlockerTimes(calendar, event_id)

  // remove blockers if found and no other event is adjacent
  pre_blockers = calendar.getEvents(blocker_times.pre.start, blocker_times.pre.end)
    .filter(event => event.getTitle() === title)
  if (!anyEventsDuring(calendar, subtractMinutes(blocker_times.pre.start, duration), blocker_times.pre.start)){
    pre_blockers.forEach(event => event.deleteEvent())}

  post_blockers = calendar.getEvents(blocker_times.post.start, blocker_times.post.end)
    .filter(event => event.getTitle() === title)
  if (!anyEventsDuring(calendar, blocker_times.post.end, addMinutes(blocker_times.post.end, duration))){
    post_blockers.forEach(event => event.deleteEvent())}

}


// SYNC TOKEN FUNCTIONS //
function retrieveIntialSyncToken(){

  events = retrieveEvents()
  const SyncToken = events["nextSyncToken"]
  console.log(SyncToken)
  return SyncToken

}

function resetToken(){
  // writes the token based on the current date and time -- Run before using the script for the first time

  token = retrieveIntialSyncToken();
  writeSyncToken(sheet_name = "variables", cell = "B2", value = token);

}

function readLastSyncToken(sheet_name = "variables", cell = "B2"){

  const ss = SpreadsheetApp.openById(VARIABLES_SHEET_ID)
  const variables_sheet = ss.getSheetByName(sheet_name);
  const token = variables_sheet.getRange(cell).getValues().flat()
  return token

}

function writeSyncToken(sheet_name = "variables", cell = "B2", value){

  const ss = SpreadsheetApp.openById(VARIABLES_SHEET_ID)
  const variables_sheet = ss.getSheetByName(sheet_name);
  variables_sheet.getRange(cell).setValue(value)

}
