const createSectionGroupContext = (manifestSectionGroup) => {
  const sectionGroup = {
    id: manifestSectionGroup.id,
    title: manifestSectionGroup.title,
  };

  return sectionGroup;
};

const createSubSectionsContext = (manifestSection, subSectionsData) => {
  const subSections = [];

  if (manifestSection.sections) {
    manifestSection.sections.map((manifestSubSection) => {
      const subSection = {};
      subSection.id = manifestSubSection.id;
      subSection.title = manifestSubSection.title;
      subSection.defaultMessage = manifestSubSection.defaultMessage;

      const foundSubSectionData = subSectionsData
        && subSectionsData.find(subSectionData => subSectionData.id === manifestSubSection.id);

      if (foundSubSectionData) {
        subSection.isActive = true;
        subSection.requirement = foundSubSectionData.requirement;
        subSection.status = foundSubSectionData.status;
      } else {
        subSection.isActive = false;
      }

      subSections.push(subSection);
    });
  }

  return subSections.length > 0 ? subSections : undefined;
};

const createSectionContext = (solutionId, manifestSection, marketingData) => {
  const { status, requirement, sections: subSectionsData } = marketingData.sections
    .find(marketingDataTask => marketingDataTask.id === manifestSection.id);

  const section = {
    URL: `/${solutionId}/section/${manifestSection.id}`,
    id: manifestSection.id,
    title: manifestSection.title,
    status,
    requirement,
    isActive: true,
    sections: createSubSectionsContext(manifestSection, subSectionsData),
  };

  return section;
};

export const createMarketingDashboardContext = (solutionId, dashboardManifest, marketingData) => {
  const context = {};
  const sectionGroups = [];

  context.previewUrl = `/${solutionId}/preview`;

  dashboardManifest.sectionGroups.map((manifestSectionGroup) => {
    const sections = [];

    const sectionGroup = createSectionGroupContext(manifestSectionGroup);

    manifestSectionGroup.sections.map((manifestSection) => {
      const section = createSectionContext(solutionId, manifestSection, marketingData);

      sections.push(section);
    });

    sectionGroup.sections = sections;
    sectionGroups.push(sectionGroup);
  });

  context.sectionGroups = sectionGroups;

  return context;
};
