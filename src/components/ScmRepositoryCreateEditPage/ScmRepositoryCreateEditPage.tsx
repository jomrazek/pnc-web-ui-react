import { ActionGroup, Button, Form, FormGroup, FormHelperText, Label, Switch, TextInput } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { SCMRepository } from 'pnc-api-types-ts';

import { breadcrumbData } from 'common/breadcrumbData';
import { ButtonTitles, EntityTitles, PageTitles } from 'common/constants';
import { scmRepositoryEntityAttributes } from 'common/scmRepositoryEntityAttributes';

import { IFieldConfigs, IFieldValues, useForm } from 'hooks/useForm';
import { useParamsRequired } from 'hooks/useParamsRequired';
import { hasScmRepositoryFailed, hasScmRepositorySucceeded, usePncWebSocketEffect } from 'hooks/usePncWebSocketEffect';
import { getErrorMessage, useServiceContainer } from 'hooks/useServiceContainer';
import { useTitle } from 'hooks/useTitle';

import { ContentBox } from 'components/ContentBox/ContentBox';
import { FormInput } from 'components/FormInput/FormInput';
import { PageLayout } from 'components/PageLayout/PageLayout';
import { ScmRepositoryUrl } from 'components/ScmRepositoryUrl/ScmRepositoryUrl';
import { ServiceContainerCreatingUpdating } from 'components/ServiceContainers/ServiceContainerCreatingUpdating';
import { TooltipWrapper } from 'components/TooltipWrapper/TooltipWrapper';

import * as scmRepositoryApi from 'services/scmRepositoryApi';

import { generateScmRepositoryName } from 'utils/entityNameGenerators';
import { validateScmUrl } from 'utils/formValidationHelpers';
import { createSafePatch } from 'utils/patchHelper';
import { generatePageTitle } from 'utils/titleHelper';

interface IScmRepositoryCreateEditPageProps {
  isEditPage?: boolean;
}

const createFieldConfigs = {
  scmUrl: {
    isRequired: true,
    validators: [{ validator: validateScmUrl, errorMessage: 'Invalid SCM URL format.' }],
  },
  preBuildSyncEnabled: {
    value: true,
  },
} satisfies IFieldConfigs;

const editFieldConfigs = {
  externalUrl: {
    validators: [{ validator: validateScmUrl, errorMessage: 'Invalid SCM URL format.' }],
  },
} satisfies IFieldConfigs;

export const ScmRepositoryCreateEditPage = ({ isEditPage = false }: IScmRepositoryCreateEditPageProps) => {
  const { scmRepositoryId } = useParamsRequired();
  const navigate = useNavigate();

  const [scmCreatingLoading, setScmCreatingLoading] = useState<boolean>(false);
  const [scmCreatingFinished, setScmCreatingFinished] = useState<SCMRepository>();
  const [scmCreatingError, setScmCreatingError] = useState<string>();

  // create page
  const serviceContainerCreatePage = useServiceContainer(scmRepositoryApi.createScmRepository);
  const serviceContainerCreatePageTaskId = serviceContainerCreatePage.data?.taskId;

  // edit page - get method
  const serviceContainerEditPageGet = useServiceContainer(scmRepositoryApi.getScmRepository);
  const serviceContainerEditPageGetRunner = serviceContainerEditPageGet.run;

  // edit page - patch method
  const serviceContainerEditPagePatch = useServiceContainer(scmRepositoryApi.patchScmRepository);

  const { register, setFieldValues, getFieldState, getFieldErrors, handleSubmit, isSubmitDisabled } = useForm();

  useTitle(
    generatePageTitle({
      pageType: isEditPage ? 'Edit' : 'Create',
      serviceContainer: serviceContainerEditPageGet,
      entityName:
        (serviceContainerEditPageGet.data && generateScmRepositoryName({ scmRepository: serviceContainerEditPageGet.data })) ||
        undefined,
      firstLevelEntity: 'SCM Repository',
    })
  );

  usePncWebSocketEffect(
    useCallback(
      (wsData: any) => {
        if (hasScmRepositoryFailed(wsData, { taskId: serviceContainerCreatePageTaskId })) {
          setScmCreatingError(wsData.notificationType);
          setScmCreatingFinished(undefined);
          setScmCreatingLoading(false);
        } else if (hasScmRepositorySucceeded(wsData, { taskId: serviceContainerCreatePageTaskId })) {
          const scmRepository: SCMRepository = wsData.scmRepository;

          setScmCreatingError(undefined);
          setScmCreatingFinished(scmRepository);
          setScmCreatingLoading(false);
        }
      },
      [serviceContainerCreatePageTaskId]
    ),
    {
      preventListening: !serviceContainerCreatePageTaskId,
    }
  );

  const submitCreate = (data: IFieldValues) => {
    setScmCreatingLoading(true);

    // reset previous results
    setScmCreatingError(undefined);
    setScmCreatingFinished(undefined);

    return serviceContainerCreatePage
      .run({
        serviceData: { data: data as SCMRepository },
      })
      .catch((error) => {
        setScmCreatingLoading(false);
        setScmCreatingError(getErrorMessage(error));
        throw error;
      });
  };

  const submitEdit = (data: IFieldValues) => {
    const patchData = createSafePatch(serviceContainerEditPageGet.data!, data);

    return serviceContainerEditPagePatch
      .run({ serviceData: { id: scmRepositoryId, patchData } })
      .then(() => {
        navigate(`/scm-repositories/${scmRepositoryId}`);
      })
      .catch((error) => {
        throw error;
      });
  };

  useEffect(() => {
    if (isEditPage) {
      serviceContainerEditPageGetRunner({ serviceData: { id: scmRepositoryId } }).then((response) => {
        setFieldValues(response.data);
      });
    }
  }, [isEditPage, scmRepositoryId, serviceContainerEditPageGetRunner, setFieldValues]);

  const formComponent = (
    <ContentBox padding isResponsive>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {!isEditPage && (
          <FormGroup
            isRequired
            label={scmRepositoryEntityAttributes.scmUrl.title}
            fieldId={scmRepositoryEntityAttributes.scmUrl.id}
            labelIcon={<TooltipWrapper tooltip={scmRepositoryEntityAttributes.scmUrl.tooltip} />}
            helperText={
              <FormHelperText isHidden={getFieldState(scmRepositoryEntityAttributes.scmUrl.id) !== 'error'} isError>
                {getFieldErrors(scmRepositoryEntityAttributes.scmUrl.id)}
              </FormHelperText>
            }
          >
            <TextInput
              isRequired
              type="text"
              id={scmRepositoryEntityAttributes.scmUrl.id}
              name={scmRepositoryEntityAttributes.scmUrl.id}
              autoComplete="off"
              {...register<string>(scmRepositoryEntityAttributes.scmUrl.id, createFieldConfigs.scmUrl)}
            />
          </FormGroup>
        )}
        {isEditPage && (
          <>
            <FormGroup
              label={scmRepositoryEntityAttributes.internalUrl.title}
              fieldId={scmRepositoryEntityAttributes.internalUrl.id}
              labelIcon={<TooltipWrapper tooltip={scmRepositoryEntityAttributes.internalUrl.tooltip} />}
            >
              {serviceContainerEditPageGet.data && <ScmRepositoryUrl internalScmRepository={serviceContainerEditPageGet.data} />}
            </FormGroup>
            <FormGroup
              label={scmRepositoryEntityAttributes.externalUrl.title}
              fieldId={scmRepositoryEntityAttributes.externalUrl.id}
              labelIcon={<TooltipWrapper tooltip={scmRepositoryEntityAttributes.externalUrl.tooltip} />}
              helperText={
                <FormHelperText isHidden={getFieldState(scmRepositoryEntityAttributes.externalUrl.id) !== 'error'} isError>
                  {getFieldErrors(scmRepositoryEntityAttributes.externalUrl.id)}
                </FormHelperText>
              }
            >
              <TextInput
                isRequired
                type="text"
                id={scmRepositoryEntityAttributes.externalUrl.id}
                name={scmRepositoryEntityAttributes.externalUrl.id}
                autoComplete="off"
                {...register<string>(scmRepositoryEntityAttributes.externalUrl.id, editFieldConfigs.externalUrl)}
              />
            </FormGroup>
          </>
        )}
        <FormGroup
          label={scmRepositoryEntityAttributes.preBuildSyncEnabled.title}
          fieldId={scmRepositoryEntityAttributes.preBuildSyncEnabled.id}
          labelIcon={<TooltipWrapper tooltip={scmRepositoryEntityAttributes.preBuildSyncEnabled.tooltip} />}
          helperText={
            <FormHelperText isHidden={getFieldState(scmRepositoryEntityAttributes.preBuildSyncEnabled.id) !== 'error'} isError>
              {getFieldErrors(scmRepositoryEntityAttributes.preBuildSyncEnabled.id)}
            </FormHelperText>
          }
        >
          <FormInput<boolean>
            {...register<boolean>(
              scmRepositoryEntityAttributes.preBuildSyncEnabled.id,
              !isEditPage ? createFieldConfigs.preBuildSyncEnabled : undefined
            )}
            render={({ value, onChange, onBlur }) => (
              <Switch
                id={scmRepositoryEntityAttributes.preBuildSyncEnabled.id}
                name={scmRepositoryEntityAttributes.preBuildSyncEnabled.id}
                label="Pre-build Sync Enabled"
                labelOff="Pre-build Sync Disabled"
                isChecked={value}
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </FormGroup>
        <ActionGroup>
          <Button variant="primary" isDisabled={isSubmitDisabled} onClick={handleSubmit(isEditPage ? submitEdit : submitCreate)}>
            {isEditPage ? ButtonTitles.update : ButtonTitles.create} {EntityTitles.scmRepository}
          </Button>
          {scmCreatingFinished?.id && (
            <Button
              variant="secondary"
              component={(props) => <Link {...props} to={`/scm-repositories/${scmCreatingFinished.id}`} />}
            >
              <CheckIcon /> {ButtonTitles.view} {EntityTitles.scmRepository}
            </Button>
          )}
        </ActionGroup>
      </Form>
    </ContentBox>
  );

  return (
    <PageLayout
      title={isEditPage ? PageTitles.scmRepositoryEdit : PageTitles.scmRepositoryCreate}
      breadcrumbs={
        isEditPage
          ? [
              {
                entity: breadcrumbData.scmRepository.id,
                title: generateScmRepositoryName({ scmRepository: serviceContainerEditPageGet.data! }),
                url: '-/edit',
              },
              { entity: breadcrumbData.edit.id, title: PageTitles.scmRepositoryEdit, custom: true },
            ]
          : [{ entity: breadcrumbData.create.id, title: PageTitles.scmRepositoryCreate }]
      }
      description={
        isEditPage ? (
          <>You can edit current SCM Repository attributes below.</>
        ) : (
          <>
            You can manually create SCM Repository, for example <Label>apache/maven.git</Label> or{' '}
            <Label>git/twitter4j.git</Label> here. SCM Repository can be created with either an Internal URL or External URL.
          </>
        )
      }
    >
      {isEditPage ? (
        <ServiceContainerCreatingUpdating
          {...serviceContainerEditPagePatch}
          serviceContainerLoading={serviceContainerEditPageGet}
          title="SCM Repository"
        >
          {formComponent}
        </ServiceContainerCreatingUpdating>
      ) : (
        <ServiceContainerCreatingUpdating data={scmCreatingFinished} loading={scmCreatingLoading} error={scmCreatingError || ''}>
          {formComponent}
        </ServiceContainerCreatingUpdating>
      )}
    </PageLayout>
  );
};
