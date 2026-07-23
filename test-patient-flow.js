const { chromium } = require('C:\\Users\\srivatsan\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5174';
const EMAIL = 'venkatesh.srinivasan@gmail.com';
const PASSWORD = 'Admin@123';
const DIR = path.join(process.env.TEMP || '/tmp', 'hms-test-screenshots');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

let sn = 0;
const bugs = [], warns = [], notes = [];

const log  = (icon, msg) => console.log(`${icon} [${++sn}] ${msg}`);
const bug  = (sec, msg)  => { bugs.push({sec,msg});  console.error(`  ❌  BUG  [${sec}] ${msg}`); };
const warn = (sec, msg)  => { warns.push({sec,msg}); console.warn (`  ⚠️   WARN [${sec}] ${msg}`); };
const note = (sec, msg)  => { notes.push({sec,msg}); console.log  (`  🔍  NOTE [${sec}] ${msg}`); };
const ss   = async (page, name) => {
  const f = path.join(DIR, `${String(sn).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log(`  📸 ${f}`);
  return f;
};

const txt = async (page) => page.$eval('body', el => el.innerText.toLowerCase()).catch(() => '');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  const consoleErrs = [];
  page.on('console',   m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', e => consoleErrs.push('PAGE ERR: ' + e.message));

  try {
    // ══════════════════════════════════════
    //  1. LOGIN
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 1: LOGIN ═══');

    log('🌐','Go to home page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await ss(page, 'home');

    log('🖱️','Click Login button in header');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(1000);
    await ss(page, 'login-modal-step1-user-type');

    // Step 1: choose user type — Admin Login
    // Step 1: Click Admin Login card (it's a div with onClick, not a button)
    log('🖱️','Click Admin Login card (div with onClick)');
    // The two login-type cards are cursor-pointer divs. Admin is the second one.
    const loginCards = await page.$$('.cursor-pointer, [class*="group cursor-pointer"]');
    log('🔍',`Login type cards found: ${loginCards.length}`);
    if (loginCards.length >= 2) {
      await loginCards[1].click({ force: true });
      log('✅','Clicked Admin Login card');
    } else {
      // Fallback: click via JS to bypass overlay interception
      await page.evaluate(() => {
        // Find h3 with "Admin Login" text and click its parent card
        const h3s = Array.from(document.querySelectorAll('h3'));
        const adminH3 = h3s.find(h => h.textContent.includes('Admin Login'));
        if (adminH3) {
          // Walk up to find the div with onClick
          let el = adminH3;
          while (el && !el.onclick) el = el.parentElement;
          if (el) el.click();
        }
      });
    }
    await page.waitForTimeout(1200);
    await ss(page, 'login-modal-step2-method');

    // Step 2: login method selector (Password vs OTP)
    const pwdBtn = await page.$('button:has-text("Password"), div:has-text("Password"):not([class*="modal"])');
    if (pwdBtn) {
      log('🖱️','Select Password login method');
      await pwdBtn.click({ force: true });
      await page.waitForTimeout(800);
      await ss(page, 'login-modal-step3-credentials');
    } else {
      log('🔍','No method selector — directly showing credentials form');
    }

    // Step 3: fill credentials — username field uses name="username"
    log('📝','Fill username');
    const emailInput = await page.$('input[name="username"], input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]');
    if (emailInput) {
      await emailInput.fill(EMAIL);
      log('✅',`Email filled in field name="${await emailInput.getAttribute('name')}"`);
    } else {
      await ss(page, 'login-no-username-field');
      bug('Login','Email/username input not found after selecting user type + method');
    }

    log('📝','Fill password');
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      await pwdInput.fill(PASSWORD);
      log('✅','Password filled');
    } else {
      bug('Login','Password input not found');
    }

    await ss(page, 'login-credentials-filled');

    log('🖱️','Submit login form');
    const submitBtn = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Continue")');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      // try pressing Enter on the password field
      await pwdInput?.press('Enter');
    }

    await page.waitForTimeout(3000);
    await ss(page, 'post-login');

    const postUrl = page.url();
    log('🔍',`Post-login URL: ${postUrl}`);
    if (postUrl.includes('/login') || postUrl === BASE_URL + '/') {
      const errEl = await page.$('[class*="error" i], .text-red-500, [class*="alert" i]');
      const errMsg = errEl ? (await errEl.innerText()).trim() : 'no error message shown';
      if (postUrl.includes('/login')) {
        bug('Login', `Still on login page. Error: "${errMsg}"`);
      }
    } else {
      log('✅',`Logged in — landed on ${postUrl}`);
    }

    // Confirm auth token in session
    const token = await page.evaluate(() => sessionStorage.getItem('accessToken_session'));
    if (token) log('✅','accessToken_session present in sessionStorage');
    else warn('Login','No accessToken_session in sessionStorage after login');

    // ══════════════════════════════════════
    //  2. PATIENTS HUB  /patients
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 2: PATIENTS HUB ═══');

    log('🌐','Navigate to /patients');
    await page.goto(`${BASE_URL}/patients`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ss(page, 'patients-hub');

    if (page.url().includes('/login')) {
      bug('Patients','Redirected to /login — ProtectedRoute rejected the session');
    }

    // Inspect nav cards
    const hubLinks = await page.$$eval('a, button', els =>
      els.filter(e => e.offsetParent !== null).map(e => e.textContent.trim()).filter(t => t.length > 1 && t.length < 50)
    );
    log('🔍',`Visible interactive labels: ${hubLinks.join(' | ')}`);

    // ══════════════════════════════════════
    //  3. REGISTER PATIENT
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 3: REGISTER PATIENT ═══');

    log('🌐','Navigate to /patients/register');
    await page.goto(`${BASE_URL}/patients/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'register-empty');

    if (page.url().includes('/login')) {
      bug('Register','Redirected to login — cannot test Register Patient');
    } else {
      // Inventory all visible inputs
      const inputs = await page.$$eval('input:not([type="hidden"]), select, textarea', els =>
        els.filter(e => e.offsetParent !== null).map(e => ({
          tag:  e.tagName,
          type: e.type || '',
          name: e.name || '',
          ph:   e.placeholder || '',
          req:  e.required,
          id:   e.id || ''
        }))
      );
      log('🔍',`Visible form fields: ${inputs.length}`);
      inputs.forEach(f => console.log(`    [${f.tag}/${f.type}] name="${f.name}" ph="${f.ph}" req=${f.req}`));
      if (inputs.length === 0) bug('Register','No form fields visible — form failed to render');

      // ── PROBE: empty submit ──
      log('🔍','Probe: click submit on empty form');
      const sub1 = await page.$('button[type="submit"], button:has-text("Register"), button:has-text("Save")');
      if (sub1) {
        await sub1.click();
        await page.waitForTimeout(800);
        await ss(page, 'register-empty-submit');
        const errs = await page.$$eval('[class*="error" i]:not([class*="border"]), .text-red-500', els =>
          els.filter(e => e.offsetParent !== null).map(e => e.innerText.trim()).filter(Boolean)
        );
        const invalids = await page.$$('input:invalid');
        if (errs.length > 0)      log('✅',`Client-side validation: ${errs.slice(0,4).join(' | ')}`);
        else if (invalids.length > 0) log('✅',`HTML5 validation: ${invalids.length} invalid inputs`);
        else warn('Register','Empty submit produced no validation errors');
      } else warn('Register','No submit button found');

      // ── Fill form ──
      log('📝','Fill all fields');
      const set = async (selector, value, label) => {
        const el = await page.$(selector);
        if (el) { await el.fill(value); log('✅',`Filled ${label}`); return true; }
        warn('Register',`${label} field not found (selector: ${selector})`);
        return false;
      };
      const pick = async (selectors, value, label) => {
        for (const s of selectors) { if (await set(s, value, label)) return; }
      };

      await pick(['input[name*="firstName" i]','input[name*="first" i]','input[placeholder*="first name" i]','input[placeholder*="First"]'], 'TestFirst', 'First Name');
      await pick(['input[name*="lastName" i]','input[name*="last" i]','input[placeholder*="last name" i]','input[placeholder*="Last"]'],   'TestLast',  'Last Name');
      await pick(['input[type="tel"]','input[name*="phone" i]','input[name*="mobile" i]','input[placeholder*="phone" i]','input[placeholder*="mobile" i]'], '9876543210','Phone');
      await pick(['input[type="email"]','input[name*="email" i]','input[placeholder*="email" i]'], `test${Date.now()}@test.com`, 'Email');
      await pick(['input[type="date"]','input[name*="dob" i]','input[name*="birth" i]','input[placeholder*="birth" i]','input[placeholder*="DOB" i]'], '1990-05-15', 'Date of Birth');

      // Gender — could be radio, select, or custom buttons
      const genderSelect = await page.$('select[name*="gender" i]');
      const genderRadio  = await page.$('input[type="radio"][value*="male" i], input[type="radio"][value*="Male"]');
      const genderBtn    = await page.$('button:has-text("Male"), span:has-text("Male")');
      if (genderSelect)     { await genderSelect.selectOption({label:'Male'}).catch(() => genderSelect.selectOption({index:1})); log('✅','Selected gender (select)'); }
      else if (genderRadio) { await genderRadio.click(); log('✅','Selected gender (radio)'); }
      else if (genderBtn)   { await genderBtn.click();   log('✅','Selected gender (button)'); }
      else warn('Register','Gender field not found');

      await ss(page, 'register-filled');

      // ── Submit ──
      const sub2 = await page.$('button[type="submit"], button:has-text("Register"), button:has-text("Save")');
      if (sub2) {
        await sub2.click();
        log('🖱️','Submitted registration form');
        await page.waitForTimeout(3000);
        await ss(page, 'register-after-submit');

        const bodyTxt = await txt(page);
        if (bodyTxt.includes('success') || bodyTxt.includes('registered') || bodyTxt.includes('created')) {
          log('✅','Success indicator visible after submit');
        } else {
          const errVisible = await page.$('[class*="error" i], .text-red-500, [role="alert"]');
          if (errVisible) {
            const errTxt = (await errVisible.innerText()).trim().substring(0,120);
            bug('Register',`Error after submit: "${errTxt}"`);
          } else {
            warn('Register','No success or error feedback visible after submit');
          }
        }
      }
    }

    // ══════════════════════════════════════
    //  4. VIEW PATIENTS
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 4: VIEW PATIENTS ═══');

    log('🌐','Navigate to /patients/view');
    await page.goto(`${BASE_URL}/patients/view`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await ss(page, 'view-patients');

    if (page.url().includes('/login')) {
      bug('ViewPatients','Redirected to /login');
    } else {
      const rows = await page.$$('table tbody tr, [class*="patient-row"], [class*="patientCard"]');
      log('🔍',`Patient rows/cards: ${rows.length}`);
      if (rows.length === 0) {
        const b = await txt(page);
        if (b.includes('loading')) warn('ViewPatients','Page shows loading — may be stuck');
        else if (b.includes('no patient') || b.includes('no record') || b.includes('no data')) note('ViewPatients','Empty state visible — might be correct');
        else bug('ViewPatients','No rows and no empty-state message');
      } else log('✅',`${rows.length} patient rows visible`);

      // Search
      const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"], input[placeholder*="filter" i]');
      if (searchInput) {
        log('✅','Search field present');
        await searchInput.fill('test');
        await page.waitForTimeout(1200);
        const afterSearch = await page.$$('table tbody tr, [class*="patient-row"]');
        log('🔍',`After search "test": ${afterSearch.length} rows`);
        await ss(page, 'view-patients-search');
        // Probe: non-existent name
        await searchInput.fill('zzzzzzzzzz');
        await page.waitForTimeout(1000);
        const zeroRows = await page.$$('table tbody tr, [class*="patient-row"]');
        log('🔍',`After search "zzzzzzzzzz": ${zeroRows.length} rows`);
        if (zeroRows.length === 0) log('✅','Search correctly returns no results for garbage input');
        else warn('ViewPatients','Search "zzzzzzzzzz" still shows rows — filter may not work');
        await searchInput.fill('');
        await page.waitForTimeout(800);
      } else warn('ViewPatients','No search/filter input on View Patients page');

      // Click a patient
      const freshRows = await page.$$('table tbody tr');
      if (freshRows.length > 0) {
        log('🔍','Click first patient row');
        await freshRows[0].click();
        await page.waitForTimeout(2000);
        await ss(page, 'patient-detail');
        const modal = await page.$('[role="dialog"], [class*="modal" i], [class*="drawer" i], [class*="panel" i], [class*="sheet" i]');
        if (modal) {
          const mc = (await modal.innerText()).trim().substring(0,200);
          log('✅',`Detail panel/modal opened: "${mc}"`);
          // Check fields inside detail
          const detailBody = await modal.innerText();
          const expectedFields = ['name','phone','email','dob','gender','age','id','patient'];
          const missing = expectedFields.filter(f => !detailBody.toLowerCase().includes(f));
          if (missing.length > 0) warn('ViewPatients',`Detail panel may be missing fields: ${missing.join(', ')}`);
          else log('✅','Detail panel contains expected patient fields');
        } else {
          warn('ViewPatients','No modal/panel/drawer opened after clicking patient row');
          // Check if navigated
          log('🔍',`URL after click: ${page.url()}`);
        }
      }
    }

    // ══════════════════════════════════════
    //  5. NEW APPOINTMENT
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 5: NEW APPOINTMENT ═══');

    log('🌐','Back to /patients hub — look for New Appointment');
    await page.goto(`${BASE_URL}/patients`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ss(page, 'patients-hub-2');

    // Find New Appointment entry point
    const newApptEl = await page.$('a:has-text("New Appointment"), button:has-text("New Appointment"), a[href*="appointment"], a:has-text("Appointment")');
    if (newApptEl) {
      log('✅','New Appointment link found');
      await newApptEl.click();
      await page.waitForTimeout(2000);
    } else {
      warn('NewAppointment','No "New Appointment" link on /patients — trying /calendar');
      await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    await ss(page, 'new-appointment-landed');
    log('🔍',`Appointment entry URL: ${page.url()}`);

    if (page.url().includes('/login')) {
      bug('NewAppointment','Redirected to /login');
    } else {
      // Check if a modal/form opened or if it's a full page
      const apptInputs = await page.$$eval('input:not([type="hidden"]), select', els =>
        els.filter(e => e.offsetParent !== null).map(e => ({ type: e.type||'', name: e.name||'', ph: e.placeholder||'' }))
      );
      log('🔍',`Appointment form visible inputs: ${apptInputs.length}`);
      apptInputs.forEach(f => console.log(`    [${f.type}] name="${f.name}" ph="${f.ph}"`));

      if (apptInputs.length === 0) {
        // Maybe there's a "+" or "New" button on calendar
        const newBtn = await page.$('button:has-text("+"), button:has-text("New"), button[aria-label*="add" i], button[aria-label*="new" i]');
        if (newBtn) {
          log('🖱️','Clicking new/add button on calendar page');
          await newBtn.click();
          await page.waitForTimeout(1500);
          await ss(page, 'new-appointment-modal');
        } else {
          warn('NewAppointment','No appointment form inputs and no add button found');
        }
      }

      // Patient search
      const patSearch = await page.$('input[placeholder*="patient" i], input[placeholder*="search patient" i], input[name*="patient" i], input[placeholder*="name" i]');
      if (patSearch) {
        log('✅','Patient search field present');
        await patSearch.fill('Test');
        await page.waitForTimeout(1500);
        await ss(page, 'appt-patient-typed');
        const dropdown = await page.$('[role="listbox"], [role="option"], [class*="dropdown" i], [class*="suggest" i], ul li');
        if (dropdown) {
          log('✅','Dropdown appears on patient search');
          const items = await page.$$('[role="option"], [class*="dropdown" i] li, ul li');
          if (items.length > 0) {
            await items[0].click();
            log('✅',`Selected first result`);
          } else warn('NewAppointment','Dropdown appeared but has no items');
        } else warn('NewAppointment','Patient search: no autocomplete dropdown appeared');
      } else warn('NewAppointment','Patient search field not found in appointment form');

      // Doctor
      const drSel = await page.$('select[name*="doctor" i], select[name*="Doctor" i]');
      if (drSel) {
        const opts = await drSel.$$eval('option', o => o.map(x => x.textContent.trim()));
        log('🔍',`Doctor options: ${opts.join(', ')}`);
        if (opts.length <= 1) warn('NewAppointment','Doctor dropdown has 0–1 options — API may not be loading');
        else { await drSel.selectOption({ index: 1 }); log('✅','Doctor selected'); }
      } else {
        // check custom dropdown
        const drCustom = await page.$('[placeholder*="doctor" i], [aria-label*="doctor" i]');
        if (drCustom) { log('✅','Custom doctor field found'); }
        else warn('NewAppointment','No doctor field found');
      }

      // Date
      const dateEl = await page.$('input[type="date"], input[name*="date" i], input[placeholder*="date" i]');
      if (dateEl) {
        const d = new Date(); d.setDate(d.getDate() + 1);
        await dateEl.fill(d.toISOString().split('T')[0]);
        log('✅',`Date set: ${d.toISOString().split('T')[0]}`);
      } else warn('NewAppointment','Date picker not found');

      // Time
      const timeEl = await page.$('input[type="time"], input[name*="time" i]');
      if (timeEl) { await timeEl.fill('10:30'); log('✅','Time set: 10:30'); }
      else warn('NewAppointment','Time picker not found');

      await ss(page, 'new-appointment-filled');

      // Probe: submit incomplete form
      log('🔍','Probe: submit empty appointment form');
      await page.goto(`${BASE_URL}/patients`, { waitUntil: 'networkidle' });
      const newApptEl2 = await page.$('a:has-text("New Appointment"), button:has-text("New Appointment"), a[href*="appointment"]');
      if (newApptEl2) await newApptEl2.click();
      await page.waitForTimeout(1500);
      const subAppt = await page.$('button[type="submit"], button:has-text("Book"), button:has-text("Schedule"), button:has-text("Save"), button:has-text("Create")');
      if (subAppt) {
        await subAppt.click();
        await page.waitForTimeout(1000);
        await ss(page, 'appt-empty-submit');
        const valErrs = await page.$$eval('[class*="error" i]:not([class*="border"]), .text-red-500', els =>
          els.filter(e => e.offsetParent !== null).map(e => e.innerText.trim()).filter(Boolean)
        );
        if (valErrs.length > 0) log('✅',`Validation on empty submit: ${valErrs.slice(0,3).join(' | ')}`);
        else warn('NewAppointment','No validation errors on empty appointment form submit');
      }
    }

    // ══════════════════════════════════════
    //  6. VIEW APPOINTMENTS
    // ══════════════════════════════════════
    console.log('\n═══ SECTION 6: VIEW APPOINTMENTS ═══');

    // First check /patients for a "View Appointments" link
    log('🌐','Back to /patients — check for View Appointments');
    await page.goto(`${BASE_URL}/patients`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ss(page, 'patients-hub-for-appts');

    const viewApptEl = await page.$('a:has-text("View Appointment"), a:has-text("Appointments"), button:has-text("View Appointment"), a:has-text("appointment" )');
    if (viewApptEl) {
      log('✅',`"View Appointments" link found: "${(await viewApptEl.innerText()).trim()}"`);
      await viewApptEl.click();
      await page.waitForTimeout(2500);
      await ss(page, 'view-appointments-page');
    } else {
      warn('ViewAppointments','No "View Appointments" link on /patients hub');
      log('🌐','Trying /calendar directly');
      await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await ss(page, 'calendar-page');
    }

    log('🔍',`View Appointments URL: ${page.url()}`);
    if (page.url().includes('/login')) {
      bug('ViewAppointments','Redirected to /login');
    } else {
      const b = await txt(page);

      // Date filter
      const dateFilt = await page.$('input[type="date"], button:has-text("Today"), button:has-text("today"), [class*="date-nav" i]');
      if (dateFilt) log('✅','Date filter/navigation present');
      else warn('ViewAppointments','No date filter visible');

      // Appointment items
      const apptEls = await page.$$('[class*="appointment" i], [class*="event" i], [class*="slot" i], table tbody tr');
      log('🔍',`Appointment elements: ${apptEls.length}`);
      if (apptEls.length === 0) {
        if (b.includes('no appointment') || b.includes('no record')) note('ViewAppointments','Empty state shown');
        else note('ViewAppointments','No appointment items — current date may have none');
      } else {
        log('✅',`${apptEls.length} appointment items visible`);
        log('🔍','Probe: click first appointment');
        await apptEls[0].click();
        await page.waitForTimeout(2000);
        await ss(page, 'appointment-clicked');
        const modal = await page.$('[role="dialog"], [class*="modal" i], [class*="drawer" i], [class*="panel" i]');
        if (modal) {
          const mc = (await modal.innerText()).trim().substring(0,200);
          log('✅',`Appointment detail panel opened: "${mc}"`);
        } else warn('ViewAppointments','No detail panel after clicking appointment');
      }
    }

    // ══════════════════════════════════════
    //  CONSOLE ERRORS
    // ══════════════════════════════════════
    console.log('\n═══ CONSOLE ERRORS ═══');
    if (consoleErrs.length === 0) log('✅','Zero console errors during entire run');
    else consoleErrs.forEach((e,i) => console.error(`  [${i+1}] ${e}`));

  } catch (err) {
    console.error('\n🚨 SCRIPT CRASHED:', err.message);
    await ss(page, 'crash').catch(()=>{});
  } finally {
    await browser.close();

    console.log('\n\n══════════════════════════════════════════════════════');
    console.log(' BUG REPORT');
    console.log('══════════════════════════════════════════════════════');
    console.log(`\n❌ BUGS (${bugs.length}):`);
    bugs.forEach(f => console.log(`  [${f.sec}] ${f.msg}`));
    console.log(`\n⚠️  WARNINGS (${warns.length}):`);
    warns.forEach(f => console.log(`  [${f.sec}] ${f.msg}`));
    console.log(`\n🔍 NOTES (${notes.length}):`);
    notes.forEach(f => console.log(`  [${f.sec}] ${f.msg}`));
    console.log(`\n📁 Screenshots: ${DIR}`);
  }
})();
