import { findExistingMarketingDataForSection } from '../helpers/findExistingMarketingDataForSection';
import { getMarketingDataForQuestion } from '../helpers/getMarketingDataForQuestion';

const addTitleIfProvided = questionManifest => (
  questionManifest.preview
    && questionManifest.preview.title ? questionManifest.preview.title : undefined
);

const shouldQuestionBeAddedToPreviewContext = (questionManifest, questionData, sectionData) => {
  const isQuestionMandatory = sectionData
    && sectionData.mandatory
    && sectionData.mandatory.some(
      mandatoryQuestionId => mandatoryQuestionId === questionManifest.id,
    );
  const questionRequirment = isQuestionMandatory ? 'Mandatory' : 'Optional';
  return (questionRequirment === 'Optional' && questionData) || (questionRequirment === 'Mandatory');
};

const overrideQuestionTypeIfApplicable = questionManifest => (
  questionManifest.preview
    && questionManifest.preview.type ? questionManifest.preview.type : questionManifest.type
);

const findValidationErrorTypeForQuestionIfApplicaple = (questionId, validationErrorsForSection) => {
  return validationErrorsForSection
   && Object.entries(validationErrorsForSection).map(([errorType, questionsWithErrors]) => {
     if (questionsWithErrors.some(questionIdWithError => questionIdWithError === questionId)) {
       return errorType;
     }
   });
};

const getErrorMessageForQuestion = (errorType, questionManifest) => {
  const submitValidationForErrorType = questionManifest.submitValidations
    .find(submitValidation => submitValidation.type.toString() === errorType.toString());

  return submitValidationForErrorType ? submitValidationForErrorType.message : undefined;
};

const createQuestionContext = (questionManifest, questionData, errorForQuestion) => {
  return {
    id: questionManifest.id,
    title: addTitleIfProvided(questionManifest),
    type: overrideQuestionTypeIfApplicable(questionManifest),
    data: questionData,
    error: errorForQuestion || undefined,
  };
};

const shouldSectionBeAddedToPreviewContext = questions => questions.length > 0;

const createSectionContext = (sectionManifest, questions) => ({
  id: sectionManifest.id,
  title: sectionManifest.title,
  questions,
});

export const createPreviewPageContext = (
  solutionId, previewManifest, existingSolutionData, previewValidationErrors,
) => {
  const sections = [];
  const errors = [];

  previewManifest.map((sectionManifest) => {
    const questions = [];

    sectionManifest.questions.map((questionManifest) => {
      const sectionData = findExistingMarketingDataForSection(
        existingSolutionData, sectionManifest.id,
      );
      const questionData = getMarketingDataForQuestion(
        sectionData, questionManifest.id, questionManifest.type,
      );

      if (shouldQuestionBeAddedToPreviewContext(questionManifest, questionData, sectionData)) {
        const validationErrorsForSection = previewValidationErrors && previewValidationErrors[sectionManifest.id];
        const errorType = findValidationErrorTypeForQuestionIfApplicaple(questionManifest.id, validationErrorsForSection);
        const errorMessage = errorType && getErrorMessageForQuestion(errorType, questionManifest);
        const errorForQuestion = errorType ? { message: errorMessage } : undefined;

        const question = createQuestionContext(
          questionManifest, questionData, errorForQuestion,
        );

        if (errorType) {
          const contextError = {};
          contextError.text = errorMessage;
          contextError.href = `#${questionManifest.id}`;
          errors.push(contextError);
        }

        questions.push(question);
      }
    });

    if (shouldSectionBeAddedToPreviewContext(questions)) {
      const section = createSectionContext(sectionManifest, questions);
      sections.push(section);
    }
  });

  const context = {
    submitPreviewUrl: `/${solutionId}/submitPreview`,
    errors: errors.length > 0 ? errors : undefined,
    sections,
  };

  return context;
};
