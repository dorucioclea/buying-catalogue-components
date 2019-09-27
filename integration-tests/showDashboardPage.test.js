import nock from 'nock';
import { Selector, ClientFunction } from 'testcafe';
import aSolutionFixture from './fixtures/aSolution.json';
import aSolutionWithMarketingDataFixture from './fixtures/aSolutionWithMarketingData.json';
import { ManifestProvider } from '../app/forms/manifestProvider';


const mocks = (isFirstLoad) => {
  if (isFirstLoad) {
    nock('http://localhost:8080')
      .get('/api/v1/Solutions/S100000-001')
      .reply(200, aSolutionFixture);
  } else {
    nock('http://localhost:8080')
      .get('/api/v1/Solutions/S100000-001')
      .reply(200, aSolutionWithMarketingDataFixture);
  }

  nock('http://localhost:8080')
    .put('/api/v1/Solutions/S100000-001')
    .reply(200, {});
};

const pageSetup = async (t, isFirstLoad = true) => {
  mocks(isFirstLoad);
  await t.navigateTo('http://localhost:1234/S100000-001');
};

fixture('Show marketing dashboard page');

test('should render the marketing dashboard page title', async (t) => {
  pageSetup(t);

  const title = Selector('h1');

  await t
    .expect(title.innerText).eql('Marketing Page - Dashboard');
});

test('should render the sectionGroups configured in the dashboard manifest', async (t) => {
  pageSetup(t);

  const dashboardManifest = new ManifestProvider().getDashboardManifest();
  const dashboardsectionGroups = dashboardManifest.sectionGroups;

  await Promise.all(dashboardsectionGroups.map(async (dashboardSection, idx) => {
    const theSection = Selector(`[data-test-id="dashboard-section-${idx + 1}"]`);
    await t
      .expect(theSection.count).eql(1)
      .expect(theSection.find('h2').innerText).eql(dashboardSection.title);
  }));
});

test('should render all the tasks for sectionGroups', async (t) => {
  pageSetup(t);

  const dashboardManifest = new ManifestProvider().getDashboardManifest();
  const dashboardsectionGroups = dashboardManifest.sectionGroups;

  await Promise.all(dashboardsectionGroups.map(async (dashboardSection, idx) => {
    const theSection = Selector(`[data-test-id="dashboard-section-${idx + 1}"]`);

    await Promise.all(dashboardSection.tasks.map(async (task, taskIdx) => {
      const theTask = theSection.find(`[data-test-id="dashboard-section-task-${taskIdx + 1}"]`);
      await t
        .expect(theTask.count).eql(1)
        .expect(theTask.find('[data-test-id="dashboard-section-task-title"]').innerText)
        .eql(task.title)
        .expect(theTask.find('[data-test-id="dashboard-section-task-requirement"]').innerText)
        .eql(task.requirement)
        .expect(theTask.find('[data-test-id="dashboard-section-task-status"]').innerText)
        .eql('INCOMPLETE');
    }));
  }));
});

test('should render the correct status for a solution with marketing data and status', async (t) => {
  pageSetup(t, false);

  const dashboardManifest = new ManifestProvider().getDashboardManifest();
  const dashboardsectionGroups = dashboardManifest.sectionGroups;

  await Promise.all(dashboardsectionGroups.map(async (dashboardSection, idx) => {
    const theSection = Selector(`[data-test-id="dashboard-section-${idx + 1}"]`);

    await Promise.all(dashboardSection.tasks.map(async (task, taskIdx) => {
      const theTask = theSection.find(`[data-test-id="dashboard-section-task-${taskIdx + 1}"]`);

      await t
        .expect(theTask.count).eql(1)
        .expect(theTask.find('[data-test-id="dashboard-section-task-title"]').innerText)
        .eql(task.title)
        .expect(theTask.find('[data-test-id="dashboard-section-task-requirement"]').innerText)
        .eql(task.requirement)
        .expect(theTask.find('[data-test-id="dashboard-section-task-status"]').innerText)
        .eql('COMPLETE');
    }));
  }));
});

test('clicking on the task link should navigate the user to the task page', async (t) => {
  pageSetup(t);

  nock('http://localhost:8080')
    .get('/api/v1/Solutions/S100000-001')
    .reply(200, aSolutionFixture);

  const getLocation = ClientFunction(() => document.location.href);

  const dashboardManifest = new ManifestProvider().getDashboardManifest();
  const dashboardsectionGroups = dashboardManifest.sectionGroups;

  await Promise.all(dashboardsectionGroups.map(async (dashboardSection, idx) => {
    const theSection = Selector(`[data-test-id="dashboard-section-${idx + 1}"]`);

    await Promise.all(dashboardSection.tasks.map(async (task, taskIdx) => {
      const theTask = theSection.find(`[data-test-id="dashboard-section-task-${taskIdx + 1}"]`);

      await t
        .click(theTask.find('a'))
        .expect(getLocation()).contains(`S100000-001/task/${task.id}`);
    }));
  }));
});
