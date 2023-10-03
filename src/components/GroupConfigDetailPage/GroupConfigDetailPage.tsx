import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { GroupConfiguration } from 'pnc-api-types-ts';

import { buildConfigEntityAttributes } from 'common/buildConfigEntityAttributes';
import { groupConfigEntityAttributes } from 'common/groupConfigEntityAttributes';

import { useQueryParamsEffect } from 'hooks/useQueryParamsEffect';
import { useServiceContainer } from 'hooks/useServiceContainer';
import { useTitle } from 'hooks/useTitle';

import { Attributes } from 'components/Attributes/Attributes';
import { AttributesItem } from 'components/Attributes/AttributesItem';
import { BuildConfigsList } from 'components/BuildConfigsList/BuildConfigsList';
import { BuildHistoryList } from 'components/BuildHistoryList/BuildHistoryList';
import { ContentBox } from 'components/ContentBox/ContentBox';
import { PageLayout } from 'components/PageLayout/PageLayout';
import { ProductVersionLink } from 'components/ProductVersionLink/ProductVersionLink';
import { ServiceContainerLoading } from 'components/ServiceContainers/ServiceContainerLoading';
import { Toolbar } from 'components/Toolbar/Toolbar';
import { ToolbarItem } from 'components/Toolbar/ToolbarItem';

import * as groupConfigApi from 'services/groupConfigApi';
import * as productVersionApi from 'services/productVersionApi';

import { generatePageTitle } from 'utils/titleHelper';

const buildConfigsListColumns = [
  buildConfigEntityAttributes.name.id,
  buildConfigEntityAttributes.buildType.id,
  buildConfigEntityAttributes['project.name'].id,
  buildConfigEntityAttributes.buildStatus.id,
  buildConfigEntityAttributes.actions.id,
];

interface IGroupConfigDetailPageProps {
  componentIdGroupBuilds?: string;
  componentIdBuildConfigs?: string;
}

export const GroupConfigDetailPage = ({
  componentIdGroupBuilds = 'b1',
  componentIdBuildConfigs = 'c1',
}: IGroupConfigDetailPageProps) => {
  const { groupConfigId } = useParams();

  const serviceContainerGroupConfig = useServiceContainer(groupConfigApi.getGroupConfig);
  const serviceContainerGroupConfigRunner = serviceContainerGroupConfig.run;

  const serviceContainerProductVersion = useServiceContainer(productVersionApi.getProductVersion);
  const serviceContainerProductVersionRunner = serviceContainerProductVersion.run;

  const serviceContainerGroupBuilds = useServiceContainer(groupConfigApi.getGroupBuilds);
  const serviceContainerGroupBuildsRunner = serviceContainerGroupBuilds.run;

  const serviceContainerBuildConfigs = useServiceContainer(groupConfigApi.getBuildConfigsWithLatestBuild);
  const serviceContainerBuildConfigsRunner = serviceContainerBuildConfigs.run;

  useEffect(() => {
    serviceContainerGroupConfigRunner({ serviceData: { id: groupConfigId } }).then((response: any) => {
      const groupConfig: GroupConfiguration = response.data;

      if (groupConfig.productVersion) {
        serviceContainerProductVersionRunner({ serviceData: { id: groupConfig.productVersion.id } });
      }
    });
  }, [serviceContainerGroupConfigRunner, serviceContainerProductVersionRunner, groupConfigId]);

  useQueryParamsEffect(
    ({ requestConfig } = {}) => {
      serviceContainerGroupBuildsRunner({ serviceData: { id: groupConfigId }, requestConfig });
    },
    { componentId: componentIdGroupBuilds }
  );

  useQueryParamsEffect(
    ({ requestConfig } = {}) => {
      serviceContainerBuildConfigsRunner({ serviceData: { groupConfigId }, requestConfig });
    },
    { componentId: componentIdBuildConfigs }
  );

  useTitle(
    generatePageTitle({
      serviceContainer: serviceContainerGroupConfig,
      firstLevelEntity: 'Group Config',
      entityName: serviceContainerGroupConfig.data?.identifier,
    })
  );

  return (
    <ServiceContainerLoading {...serviceContainerGroupConfig} title="Group Config details">
      <PageLayout
        title={serviceContainerGroupConfig.data?.name}
        sidebar={{
          title: 'Build History',
          content: (
            <BuildHistoryList
              serviceContainerBuilds={serviceContainerGroupBuilds}
              variant="Group Build"
              componentId={componentIdGroupBuilds}
            />
          ),
        }}
      >
        <ContentBox padding marginBottom isResponsive>
          <Attributes>
            <AttributesItem title={groupConfigEntityAttributes.name.title}>
              {serviceContainerGroupConfig.data?.name}
            </AttributesItem>
            <AttributesItem title={groupConfigEntityAttributes.productVersion.title}>
              <ServiceContainerLoading
                {...serviceContainerProductVersion}
                variant="inline"
                title={groupConfigEntityAttributes.productVersion.title}
              >
                <ProductVersionLink productVersion={serviceContainerProductVersion.data} />
              </ServiceContainerLoading>
            </AttributesItem>
          </Attributes>
        </ContentBox>

        <Toolbar borderBottom>
          <ToolbarItem>
            <TextContent>
              <Text component={TextVariants.h2}>Build Configs</Text>
            </TextContent>
          </ToolbarItem>
        </Toolbar>

        <BuildConfigsList
          columns={buildConfigsListColumns}
          serviceContainerBuildConfigs={serviceContainerBuildConfigs}
          componentId={componentIdBuildConfigs}
        />
      </PageLayout>
    </ServiceContainerLoading>
  );
};
