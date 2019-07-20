/**
 * Registration on the www.tmforum.org portal
 */

const puppeteer = require('puppeteer');
const faker     = require('faker');
const fs        = require('fs');
const minimist  = require('minimist');
const shell     = require('shelljs');
const ImapClient= require('emailjs-imap-client');
const interval  = require('interval-promise');

const url = 'https://www.tmforum.org/user-registration/';
const imap_host = 'imap.mail.yahoo.com';
//const imap_host = 'imap.gmail.com';
const imap_port = 993;
const userAgent = faker.internet.userAgent();

const SCR_LOAD_FORM             = '1_load_form.png';
const SCR_FILL_FORM_PAGE1_UP    = '2_fill_form_part_1.png';
const SCR_FILL_FORM_PAGE1_DOWN  = '2_fill_form_part_2.png';
const SCR_FILL_FORM_PAGE2_COMP  = '3_company.png';
const SCR_FILL_FORM_PAGE3       = '4_last.png';
const SCR_PAGE_SEND_EMAIL       = '5_reg.png';
const SCR_PAGE_ACTIVATE         = '6_activate.png';

const gender = 1;

const css_name       = '.gform_body input[placeholder="Enter your first name"]';
const css_surname    = '.gform_body input[placeholder="Enter your last name"]';
const css_password   = '.gform_body input[placeholder="Password"]';
const css_repassword = '.gform_body input[placeholder="Confirm Password"]';
const css_email      = '.gform_body input[placeholder="Enter your email"]';
//const css_company    = '#input_6_68';
const css_phone      = '.gform_body input[placeholder="Enter your phone number"]';
const css_job        = '.gform_body input[placeholder="Enter your job"]';
const css_country    = '.gform_body select#input_6_23';
const css_state      = '.gform_body select#input_6_25';
const css_agree      = '.gform_body #choice_6_51_1';
const css_btn_next   = '.gform_body #gform_next_button_6_55';

const css_company    = '#gform_wrapper_6 input#input_6_56';

const css_btn_next1  = '#gform_wrapper_6 input#gform_next_button_6_31';

const css_chk_bx     = '#gform_wrapper_6 label#label_6_46_1';
const css_btn_reg    = '#gform_wrapper_6 #gform_submit_button_6';
const css_end        = '#content-page a[href="mailto:webservices@tmforum.org"]';

const LOGGER = true;

const EMAIL_COUNT_CHECK = 20;

let keyb_delay_min = 50;
let keyb_delay_max = 300;
let keyb_delay_dlt = 30;

let mouse_delay_min = 30;
let mouse_delay_max = 80;
let mouse_delay_dlt = 20;

let keyb_delay = Math.random() * (keyb_delay_max - keyb_delay_min) + keyb_delay_min;
let mouse_delay = Math.random() * (mouse_delay_max - mouse_delay_min) + mouse_delay_min;


/**
 * Function get random the keybord dalay
 */

function getKeybDelay(delay, delta) {
    return 2 * Math.random() * delay + delta - delay;
};

const args = minimist(process.argv.slice(2));

if (!args.hasOwnProperty('email'))
    throw new Error('The email is absent');

if (!args.hasOwnProperty('pass'))
    throw new Error('The pass is absent');

params = {
    gender  : gender,
    name    : faker.name.firstName(gender),
    surname : faker.name.lastName(gender),
    password: faker.internet.password(),
    email   : args.email,
    e_pass  : args.pass,
    phone   : faker.phone.phoneNumber(),
    job     : faker.name.jobTitle(),
    country : 'us',
    state   : 'Alabama',
    company : faker.company.companyName()
};

const chk_conf_email = 'We have sent you an activation e-mail to ' + params.email + ' to confirm your e-mail address';
const dir = __dirname + '/res/tmforum.org/' + params.email + '/';

if (!fs.existsSync(dir)) {
    let list_node = dir.split('/');
    let str = '';
    for(var i in list_node) {
        str += list_node[i] + '/';
        if(list_node[i] != '' && !fs.existsSync(str)) fs.mkdirSync(str);
    };
};

const dir_prof = dir + 'profiles';
if (!fs.existsSync(dir_prof)) fs.mkdirSync(dir_prof);

const dir_screens = dir + 'screenshots/';
if (!fs.existsSync(dir_screens)) fs.mkdirSync(dir_screens);

fs.writeFileSync(dir + 'param.json', JSON.stringify(params));

const LOG_FILE = dir + 'debug.log';

/**
 * The logger
 */

function log(txt) {
    if(LOGGER) {
        let date = new Date();
        let month = date.getMonth() + 1;
        if (month < 10) month = '0' + month;
        let day = date.getDate();
        if (day < 10) day = '0' + day;
        let hour = date.getHours();
        if (hour < 10) hour = '0' + hour;
        let minutes = date.getMinutes();
        if (minutes < 10) minutes = '0' + minutes;
        let seconds = date.getSeconds();
        if (seconds < 10) seconds = '0' + seconds;
        txt =  date.getFullYear() + '-' + month + '-' + day + ' ' +
            hour + ':' + minutes + ':' + seconds + ' =>    ' + txt;
        fs.writeFileSync(LOG_FILE, txt + "\r\n", {'flag': 'a'});
    };
};

if(LOGGER)
    fs.writeFileSync(LOG_FILE, "\r\n", {'flag': 'a'});

log('Registration on the portal => ' + url + "\r\n" +
    '===================================================================================================' + "\r\n");

(async () => {

    try {
        log('Launch browser');
        const browser = await puppeteer.launch({
            headless: true,
            ignoreHTTPSErrors: true,
            userDataDir : dir_prof,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'],
            defaultViewport : {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            }
        });

        // Connect to the imap server
        log('Instance IMAP');
        const imap = new ImapClient.default(imap_host, imap_port, {
            auth: {
                user: params.email,
                pass: params.e_pass
            }
        });

        imap.logLevel = imap.LOG_LEVEL_NONE;

        const page = await browser.newPage();
        await page.setCacheEnabled(false);
        page.setUserAgent(userAgent);

        page.on('load', () => log('Page loaded'));

        log('Open page => ' + url);
        await page.goto(url);
        //await page.waitForNavigation();

        log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_LOAD_FORM);
        await page.screenshot({path: dir_screens + SCR_LOAD_FORM});

        // Fill the name field
        log('NAME => ' + params.name + "\r\n    CSS => " + css_name);
        await page.type(css_name, params.name, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the surname field
        log('SURNAME => ' + params.surname + "\r\n    CSS => " + css_surname);
        await page.type(css_surname, params.surname, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the password field
        log('PASSWORD => ' + params.password + "\r\n    CSS => " + css_password);
        await page.type(css_password, params.password, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the password confirm field
        log('PASSWORD CONFIRM => ' + params.password + "\r\n    CSS => " + css_repassword);
        await page.type(css_repassword, params.password, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the email confirm field
        log('EMAIL => ' + params.email + "\r\n    CSS => " + css_email);
        await page.type(css_email, params.email, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_FILL_FORM_PAGE1_UP);
        await page.screenshot({path: dir_screens + SCR_FILL_FORM_PAGE1_UP});

        // Fill the phone field
        log('PHONE => ' + params.phone + "\r\n    CSS => " + css_phone);
        await page.type(css_phone, params.phone, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the job field
        log('JOB => ' + params.job + "\r\n    CSS => " + css_job);
        await page.type(css_job, params.job, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

        // Fill the country field
        log('COUNTRY select => ' + params.country + "\r\n    CSS => " + css_country);
        await page.select(css_country, params.country);

        // Fill the job state
        log('waitForSelector => ' + css_state);
        await page.waitForSelector(css_state);

        log('STATE select => ' + params.state + "\r\n    CSS => " + css_state);
        await page.select(css_state, params.state);

        // Fill the agree field
        log('AGREEMENT => Click ' + "\r\n    CSS => " + css_agree);
        await page.click(css_agree, {delay : getKeybDelay(mouse_delay, mouse_delay_dlt)});

        log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_FILL_FORM_PAGE1_DOWN);
        await page.screenshot({path: dir_screens + SCR_FILL_FORM_PAGE1_DOWN});

        // Click next the button
        log('NEXT BUTTON => Click' + "\r\n    CSS => " + css_btn_next);
        await page.click(css_btn_next, {delay : getKeybDelay(mouse_delay, mouse_delay_dlt)});

        log('waitForSelector => ' + css_company);
        await page.waitFor(css_company, {timeout: 15000});
        await page.waitFor(css_company, {visible: true});

        try {

            // Fill the company field
            log('COMPANY => ' + params.company + "\r\n    CSS => " + css_company);
            await page.type(css_company, params.company, {delay : getKeybDelay(keyb_delay, keyb_delay_dlt)});

            log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_FILL_FORM_PAGE2_COMP);
            await page.screenshot({path: dir_screens + SCR_FILL_FORM_PAGE2_COMP});

            log('NEXT BUTTON => Click' + "\r\n    CSS => " + css_btn_next1);
            await page.click(css_btn_next1, {delay : getKeybDelay(mouse_delay, mouse_delay_dlt)});

        } catch(Err) {};

        log('waitForSelector => ' + css_chk_bx);
        await page.waitFor(css_chk_bx, {timeout: 10000});
        await page.waitFor(css_chk_bx, {visible: true});

        // Fill the last field
        log('CHECKBOX => Click' + "\r\n    CSS => " + css_chk_bx);
        await page.click(css_chk_bx, {delay : getKeybDelay(mouse_delay, mouse_delay_dlt)});

        log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_FILL_FORM_PAGE3);
        page.screenshot({path: dir_screens + SCR_FILL_FORM_PAGE3});

        log('REGISTRY BUTTON => Click' + "\r\n    CSS => " + css_btn_reg);
        await page.click(css_btn_reg, {delay : getKeybDelay(mouse_delay, mouse_delay_dlt)});

        log('wait text ' + "\r\n    " + '=> ' + chk_conf_email);
        await page.waitFor(7000);
        await page.waitFor(text => !!(document.body.innerText.indexOf(text) !== -1), {}, chk_conf_email);

        log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_PAGE_SEND_EMAIL);
        await page.screenshot({path: dir_screens + SCR_PAGE_SEND_EMAIL});

        // Connect to IMAP server
        log( 'IMAP connect');
        await imap.connect();

        const query = {header: ['subject', 'TM Forum']};

        let stoppedExternally = false;
        const stopExternally = () => {stoppedExternally = true};

        // Start check the email box
        log( 'Run interval');
        interval(async (iteration, stop) => {

            if (stoppedExternally) {
                stop();
            };

            var href = false;

            // Search the email list
            log( 'Search email' + "\r\n    => " + query.header[0] + ' => ' + query.header[1]);
            const list = await imap.search('INBOX', query, {byUid: true});

            for (let i in list) {

                // Read the email
                log( 'Open email => ' + i);
                const messages = await imap.listMessages('INBOX', list[i], ['uid','envelope','bodystructure','body[]']);

                let subject = messages[0]['envelope']['subject'];
                log( 'Subject => ' + subject);
                //let boundary = messages[0]['bodystructure']['parameters']['boundary'];

                // Check of the subject with text: TM Forum Activate
                if(subject.indexOf('TM Forum') !== -1 && subject.indexOf('Activate') !== -1) {
                    let body = messages[0]['body[]'];

                    body = body.split('=3D').join('=');
                    body = body.split('=' + "\r\n").join('');

                    // Write email in the file
                    log( 'Save email into file' + "\r\n    => " + dir + 'email.eml');
                    fs.writeFileSync(dir + 'email.eml', body);

                    // Get html from email
                    let s = body.indexOf('<!DOCTYPE');
                    let e = body.indexOf('</html>', s);
                    let html = body.substr(s, e - s + 7);

                    // Write html in the file
                    log( 'Save html into file' + "\r\n    => " + dir + 'email.html');
                    fs.writeFileSync(dir + 'email.html', html);

                    // Get href from the html for activate
                    s = html.indexOf('Please activate your account by clicking');
                    s = html.indexOf('href', s);
                    s = html.indexOf('"', s);
                    e = html.indexOf('"', s+1);
                    href = html.substr(s+1, e-s-1);
                    log( 'Found the href' + "\r\n    => " + href);

                    break;
                };
            };

            if (href) {

                // The account activate
                log( 'Goto the page' + "\r\n    => " + href);
                await page.goto(href);

                log( 'ScrteenShot' + "\r\n    => " + dir_screens + SCR_PAGE_ACTIVATE);
                await page.screenshot({path: dir_screens + SCR_PAGE_ACTIVATE});

                log( 'Browser close');
                await browser.close();

                try {
                    shell.exec('pkill chrome');
                } catch(Err) {};

                try {
                    log( 'IMAP connection close');
                    imap.logout();
                    imap.close();
                } catch (Err) {};

                try {
                    log( 'Program close');
                    process.exit();
                } catch(Err) {};

                // Stop the function - interval
                log( 'Stop the function - interval');
                stop();
            };

        }, 15000, {iterations: EMAIL_COUNT_CHECK});
    } catch (Err) {
        log( 'Exception error ' + Err.name + ":" + Err.message + "\n" + Err.stack);
        process.exit();
    };

}) ();


