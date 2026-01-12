PITSTOP 

A collaborative road trip planning web application

Project Overview:

PITSTOP is a full-stack web application that allows groups of friends to collaboratively plan road trips, invite friends, propose stops along the way or music in a shared playlist. There is also functionality to track shared expenses. This was originally a project made for a course, CSE 248, but it has since been reworked and had some new features added, so I decided to put it in a public repository to showcase it on my resume.

Features:

User Authentication via Firebase

Trip Management:
Create trips with start/end locations and dates
Invite your friends to the trip
Permissions for the creator and participants

Proposals and Voting:
Search for stops along the route already being taken, showing those with the lowest detour time first using the Google Maps API.
Search for songs through the Spotify API.
Each participant in the trip gets a chance to vote on the proposed stops and songs, building a shared playlist and adding stops to the route.

Expense Tracking: 
Add and view shared trip expenses
Full expense history for each trip

Maps & Routing:
Map rendering through MapLibre
Distance calculation and size fitting the map to show the entire route

Frontend: 
Next.js
React 
Javascript (technically Typescript, but all valid JS is valid TS)
Tailwind CSS
MapLibre GL 
Google Maps JavaScript API
Axios

Backend:
Node.js
Express
Typescript (JS, but same idea)
MySQL
Firebase
Spotify API
Google Maps API

Environment Variables:
Obviously, the actual keys are not committed to the Github repository, please refer to the env.example and grab your own necessary keys and make a .env.local file with these keys.

Database Setup:
Putting all instructions to set up the DB here would be quite long and cumbersome, so if you'd like to run this project on your machine, please reach out to me on LinkedIn, https://www.linkedin.com/in/timothy-gribbin/. 

Run Locally:

After you've gotten the DB schema from me, you can clone the repository to your machine and run:

cd backend
npm install
npm run dev

This will start the backend, open another terminal window and run:

cd frontend
npm install
npm run dev

This will start the frontend.

You will now be able to view the project in your browser at your frontend local host.


If you have any questions about this project, please don't hesitate to reach out.