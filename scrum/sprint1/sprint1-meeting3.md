Sprint 1 - Scrum Meeting 3 for Chick-fil-B

Prepared by: Christopher Colling

Meeting Date: November 7, 2022

### Meeting Attendees

- Christopher Colling
- Nicolas Garcia Odar
- William Harkins
- Arindam Gahlot
- Andrew Zehrer

### Meeting Agenda Items

- Discuss our individual progress with starting implementation and how we should integrate them together
- Finalize a back-end to front-end webpage communication methodology, whether it be ejs or fetch requests with app.get(), and refactor any existing components necessary.

### Status Update Since Last Meeting

Accomplishments:
- Christopher Colling - I have been spending time polishing my knowledge about ejs and Express HTTP web page sending. Today I am going to be connecting the webpages to (temporarily) empty app.js requests (possibly organizing app.js into sub-files). Then, I will also be making authentication more secure, with some sort of cookie or generated token value to get a response from the back-end to see a loaded web-page. If I have time, I will help make the web-pages prettier.
- Nicolas Garcia - I’ve been working on familiarizing myself with nodejs and how the pool function actually works with connecting to the database. I plan on creating functions that were previously used in DBRequest to help with functionality on the back-end and connecting that to what we already have on the front-end.
- Billy Harkins - I have been working on integrating the cashier view functionality that I created into the main project. I was successful in this goal. I plan to update this functionality to fix bugs regarding the position of the checkout  button and implement the functionality of the checkout button. My main impediment has been reformatting the main project to support EJS templating.
- Andrew - Manager view has the bare bones currently. I will add functionality for database calls, to be able to see ingredients table, products table, and employee table. Reports may have to wait until the next sprint. I would like someone else to help with making the CSS look nicer in the next sprint.
- Arindam - I have made buttons more easy to read and interpret by a person having low eyesight on the customer GUI, as they would change color when hovered over them. I was reading about how to use google maps, google translate in our HTML to make our website more universal. Main challenge is pressing the button in one flexbox and displaying the image in another flexbox, also adding different colors to buttons specifying entree, meal, drinks, etc.

Tasks Completed:
| Task Description | Assigned to | Completed? (yes/no) |
| ---------------- | ----------- | ------------------- |
| Fully complete the static implementation of the Customer GUI / home page, with accessibility in mind. | Arindam Gahlot | yes |
| Create a working connection system to the database to be implemented with the web pages later. | Nicolas Garcia Odar | yes |
| Create a working routing system with Node.js to render the web pages correctly based on the full URL. | Christopher Colling | yes |
| Create a static implementation of the front-end Manager GUI web page. | Andrew Zehrer | yes |
| Create a static implementation of the front-end Cashier GUI web page. | Billy Harkins | yes |

### Before The Next Meeting

Plans:
- Work on more final polishing for the functionality, worry about web page design later, get to authentication if possible.
- Restructure the method that front-end web pages are sent to the clients in an organized manner, and create a simple and intuitive system for database requests.

Task Assignments:
| Task Description | Assigned to |
| ---------------- | ----------- |
| Node.js Backend - Interact with Database | Nicolas Garcia Odar |
| Customer GUI - Responsive JavaScript | Christopher Colling |
| Node.js Backend - Interact with HTTP Requests | Christopher Colling |
| Add more functionality to the front-end portion of the Manager GUI | Andrew Zehrer |
| Fix visual bugs in the Cashier GUI | Billy Harkins |
| Add more visuals to the main page | Arindam Gahlot |

### Minutes from Previous Meeting

In our previous Scrum meeting, we discussed our progress in our own individual components, whether it be working with the database, or making our own individual webpages. For the rest of the sprint, the main goal is integration of our created components together.