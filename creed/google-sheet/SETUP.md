# Connecting the survey to your Google Sheet

About 5 minutes, one time only.

1. Go to sheets.google.com and create a blank sheet. Name it "Apostles' Creed Responses".
2. In the sheet, click Extensions > Apps Script.
3. Delete the sample code, paste in everything from Code.gs, and click Save.
4. Click Deploy > New deployment. Click the gear icon next to "Select type" and choose Web app.
   - Description: Creed responses
   - Execute as: Me
   - Who has access: Anyone
5. Click Deploy, then Authorize access and choose your Google account.
   Google will warn that the app "isn't verified" because you wrote it yourself.
   Click Advanced > Go to (project name) (unsafe) > Allow. It only touches this one sheet.
6. Copy the Web app URL (it ends in /exec) and send it to me.

Optional check: paste the URL into your browser. You should see
"response collector is running", and a "Responses" tab will appear in the sheet.

Once the URL is added to creed/config.js, a "Send to Erv" button appears on every results page,
and each submission becomes one row: date, name, email, note, survey type, essentials score,
flagged statement numbers, a score for each of the 12 articles, and all 59 answers.
