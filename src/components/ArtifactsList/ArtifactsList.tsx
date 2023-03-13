import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  FlexProps,
  Label,
  Switch,
} from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useEffect, useState } from 'react';

import { Artifact } from 'pnc-api-types-ts';

import { PageTitles } from 'common/constants';

import { IServiceContainer } from 'hooks/useServiceContainer';
import { ISortOptions, useSorting } from 'hooks/useSorting';

import { ArtifactQualityLabel } from 'components/ArtifactQualityLabel/ArtifactQualityLabel';
import { ArtifactRepositoryTypeLabel } from 'components/ArtifactRepositoryTypeLabel/ArtifactRepositoryTypeLabel';
import { BuildName } from 'components/BuildName/BuildName';
import { ContentBox } from 'components/ContentBox/ContentBox';
import { Filtering, IFilterAttribute, IFilterOptions } from 'components/Filtering/Filtering';
import { Pagination } from 'components/Pagination/Pagination';
import { ParsedArtifactIdentifier } from 'components/ParsedArtifactIdentifier/ParsedArtifactIdentifier';
import { ServiceContainerLoading } from 'components/ServiceContainers/ServiceContainerLoading';
import { Toolbar } from 'components/Toolbar/Toolbar';
import { ToolbarItem } from 'components/Toolbar/ToolbarItem';

const filterOptions: IFilterOptions = {
  filterAttributes: {
    identifier: {
      id: 'identifier',
      title: 'Identifier',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
    artifactQuality: {
      id: 'artifactQuality',
      title: 'Artifact Quality',
      filterValues: ['NEW', 'VERIFIED', 'TESTED', 'DEPRECATED', 'BLACKLISTED', 'TEMPORARY', 'DELETED', 'IMPORTED'],
      operator: '==',
    },
    buildCategory: {
      id: 'buildCategory',
      title: 'Build Category',
      filterValues: ['STANDARD', 'SERVICE'],
      operator: '==',
    },
    filename: {
      id: 'filename',
      title: 'Filename',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
    'targetRepository.repositoryType': {
      id: 'targetRepository.repositoryType',
      title: 'Repository Type',
      filterValues: ['MAVEN', 'GENERIC_PROXY', 'NPM', 'COCOA_POD', 'DISTRIBUTION_ARCHIVE'],
      operator: '==',
    },
    md5: {
      id: 'md5',
      title: 'md5',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
    sha1: {
      id: 'sha1',
      title: 'sha1',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
    sha256: {
      id: 'sha256',
      title: 'sha256',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
  },
};

const sortOptions: ISortOptions = {
  identifier: {
    id: 'identifier',
    title: 'Identifier',
    tableColumnIndex: 0,
    isDefault: true,
  },
  'build.submitTime': {
    id: 'build.submitTime',
    title: 'Build Submit Time',
    tableColumnIndex: 1,
  },
  artifactQuality: {
    id: 'artifactQuality',
    title: 'Artifact Quality',
    tableColumnIndex: 2,
  },
  buildCategory: {
    id: 'buildCategory',
    title: 'Build Category',
    tableColumnIndex: 3,
  },
  filename: {
    id: 'filename',
    title: 'File Name',
    tableColumnIndex: 4,
  },
};

const spaceItemsSm: FlexProps['spaceItems'] = { default: 'spaceItemsSm' };
const spaceItemsLg: FlexProps['spaceItems'] = { default: 'spaceItemsLg' };

interface IArtifactsListProps {
  serviceContainerArtifacts: IServiceContainer;
  componentId: string;
}

/**
 * Component displaying list of Artifacts.
 *
 * @param serviceContainerArtifacts - Service Container for Artifacts
 * @param componentId - Component ID
 */
export const ArtifactsList = ({ serviceContainerArtifacts, componentId }: IArtifactsListProps) => {
  const { getSortParams } = useSorting(sortOptions, componentId);

  const [isArtifactIdentifierParsed, setIsArtifactIdentifierParsed] = useState<boolean>(false);

  const [expandedArtifacts, setExpandedArtifacts] = useState<string[]>([]);
  const [areAllArtifactsExpanded, setAreAllArtifactsExpanded] = useState<boolean | undefined>(undefined);
  const setArtifactExpanded = (artifact: Artifact, isExpanding = true) =>
    setExpandedArtifacts((prevExpanded) => {
      const otherExpandedArtifactIdentifiers = prevExpanded.filter((r) => r !== artifact.identifier);
      return isExpanding ? [...otherExpandedArtifactIdentifiers, artifact.identifier] : otherExpandedArtifactIdentifiers;
    });
  const isArtifactExpanded = (artifact: Artifact) => expandedArtifacts.includes(artifact.identifier);

  useEffect(() => {
    const shouldParse = window.localStorage.getItem('is-artifact-identifier-parsed') === 'true';
    setIsArtifactIdentifierParsed(shouldParse);
  }, []);

  useEffect(() => {
    if (areAllArtifactsExpanded === true) {
      setExpandedArtifacts(serviceContainerArtifacts.data?.content.map((artifact: Artifact) => artifact.identifier));
    } else if (areAllArtifactsExpanded === false) {
      setExpandedArtifacts([]);
    }
  }, [areAllArtifactsExpanded, serviceContainerArtifacts.data?.content]);

  return (
    <>
      <Toolbar>
        <ToolbarItem>
          <Filtering
            filterOptions={filterOptions}
            componentId={componentId}
            onFilter={(filterAttribute: IFilterAttribute, _) => {
              if (['md5', 'sha1', 'sha256'].includes(filterAttribute.id)) {
                setAreAllArtifactsExpanded(true);
              }
            }}
          />
        </ToolbarItem>
        <ToolbarItem marginLeft="20px">
          <Switch
            id="toggle-artifact-name-parsed"
            label="Parse artifact identifier"
            labelOff="Parse artifact identifier"
            isChecked={isArtifactIdentifierParsed}
            onChange={(checked) => {
              setIsArtifactIdentifierParsed(checked);
              window.localStorage.setItem('is-artifact-identifier-parsed', `${checked}`);
            }}
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            variant="tertiary"
            onClick={() => {
              setAreAllArtifactsExpanded(areAllArtifactsExpanded !== undefined ? !areAllArtifactsExpanded : true);
            }}
            isSmall
          >
            {areAllArtifactsExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
        </ToolbarItem>
      </Toolbar>

      <ContentBox borderTop>
        <ServiceContainerLoading {...serviceContainerArtifacts} title={PageTitles.artifacts}>
          <TableComposable isExpandable isStriped variant="compact">
            <Thead>
              {/**
               * If column order is changed, the property tableColumnIndex (see sortOptions) has to be updated.
               * Better solution can be implemented in the future.
               */}
              <Tr>
                <Th />
                <Th width={35} sort={getSortParams(sortOptions['identifier'].id)}>
                  Identifier
                </Th>
                <Th width={15} sort={getSortParams(sortOptions['build.submitTime'].id)}>
                  Build
                </Th>
                <Th width={10} sort={getSortParams(sortOptions['artifactQuality'].id)}>
                  Artifact Quality
                </Th>
                <Th width={10} sort={getSortParams(sortOptions['buildCategory'].id)}>
                  Build Category
                </Th>
                <Th width={20} sort={getSortParams(sortOptions['filename'].id)}>
                  Filename
                </Th>
              </Tr>
            </Thead>
            {serviceContainerArtifacts.data?.content.map((artifact: Artifact, rowIndex: number) => (
              <Tbody key={rowIndex}>
                <Tr>
                  <Td
                    expand={{
                      rowIndex,
                      isExpanded: isArtifactExpanded(artifact),
                      onToggle: () => {
                        setArtifactExpanded(artifact, !isArtifactExpanded(artifact));
                        setAreAllArtifactsExpanded(undefined);
                      },
                    }}
                  />
                  <Td>
                    <Flex spaceItems={spaceItemsLg}>
                      <FlexItem>
                        {artifact.targetRepository?.repositoryType && (
                          <ArtifactRepositoryTypeLabel repositoryType={artifact.targetRepository?.repositoryType} />
                        )}
                      </FlexItem>
                      <FlexItem>
                        {isArtifactIdentifierParsed ? <ParsedArtifactIdentifier artifact={artifact} /> : artifact.identifier}
                      </FlexItem>
                    </Flex>
                  </Td>
                  <Td>{artifact.build && <BuildName build={artifact.build} long />}</Td>
                  <Td>
                    <ArtifactQualityLabel quality={artifact.artifactQuality} />
                  </Td>
                  <Td>
                    <Label color="grey">{artifact.buildCategory}</Label>
                  </Td>
                  <Td>
                    <Flex spaceItems={spaceItemsSm}>
                      <FlexItem>
                        <a href={artifact.publicUrl} target="_self">
                          <DownloadIcon />
                        </a>
                      </FlexItem>
                      <FlexItem>
                        <a href={artifact.publicUrl} target="_self">
                          {artifact.filename}
                        </a>
                      </FlexItem>
                    </Flex>
                  </Td>
                </Tr>
                <Tr isExpanded={isArtifactExpanded(artifact)}>
                  <Td />
                  <Td colSpan={5}>
                    <ExpandableRowContent>
                      <DescriptionList isHorizontal isCompact>
                        <DescriptionListGroup>
                          <DescriptionListTerm>md5</DescriptionListTerm>
                          <DescriptionListDescription>{artifact.md5}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>sha1</DescriptionListTerm>
                          <DescriptionListDescription>{artifact.sha1}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>sha256</DescriptionListTerm>
                          <DescriptionListDescription>{artifact.sha256}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </ExpandableRowContent>
                  </Td>
                </Tr>
              </Tbody>
            ))}
          </TableComposable>
        </ServiceContainerLoading>
      </ContentBox>

      <Pagination componentId={componentId} count={serviceContainerArtifacts.data?.totalHits} />
    </>
  );
};