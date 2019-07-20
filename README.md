Sample working with puppeteer
==============================

Testing working the puppeteer. Fill registration form on the site: https://www.tmforum.org/user-registration/. 
It is written only for training. It cannot be used to the detriment of the website: https://www.tmforum.org. 
Using:
- puppeteer
- faker
- emailjs-imap-client
- interval-promise

Run script reg.js with parameters: --email and --pass
Where --email : working the email address, --pass : password for email.

The result of work of a script is located in the direсtory: res\tmforum.org\email.
The debug.log file contain the log of the operations
The param.json file contain the parameters for form registrations.

Screenshots is located in the direstory: res\tmforum.org\email\screenshots

The direсtory: res\tmforum.org\email\profiles contains a browser profile