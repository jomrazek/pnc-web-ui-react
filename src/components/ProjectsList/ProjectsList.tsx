import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

import { Project } from 'pnc-api-types-ts';

import { PageTitles } from 'common/constants';

import { ActionButton } from 'components/ActionButton/ActionButton';
import { ContentBox } from 'components/ContentBox/ContentBox';
import { Filtering, IFilterOptions } from 'components/Filtering/Filtering';
import { Pagination } from 'components/Pagination/Pagination';
import { ProjectLink } from 'components/ProjectLink/ProjectLink';
import { ProtectedComponent } from 'components/ProtectedContent/ProtectedComponent';
import { ServiceContainerLoading } from 'components/ServiceContainers/ServiceContainerLoading';
import { ISortOptions, Sorting } from 'components/Sorting/Sorting';
import { Toolbar } from 'components/Toolbar/Toolbar';
import { ToolbarItem } from 'components/Toolbar/ToolbarItem';

// keeping also not supported operations for testing purposes
const filterOptions: IFilterOptions = {
  filterAttributes: {
    name: {
      id: 'name',
      title: 'Name',
      placeholder: 'string | !string | s?ring | st*ng',
      operator: '=like=',
    },
    description: {
      id: 'description',
      title: 'Description',
      operator: '=like=',
    },
    customb: {
      id: 'customb',
      title: 'Custom',
      isCustomParam: true,
      operator: '=like=',
    },
    status: {
      id: 'status',
      title: 'Status',
      filterValues: ['SUCCESS', 'REJECTED', 'FAILED', 'CANCELLED', 'BUILDING', 'NO_REBUILD_REQUIRED', 'SYSTEM_ERROR'],
      operator: '==',
    },
  },
};

const sortOptions: ISortOptions = {
  name: {
    id: 'name',
    title: 'Name',
  },
  description: {
    id: 'description',
    title: 'Description',
  },
};

interface IProjectsList {
  serviceContainerProjects: any;
  componentId: string;
}

/**
 * Component displaying list of Projects.
 *
 * @param serviceContainerProjects - Service Container for Projects
 * @param componentId - Component ID
 */
export const ProjectsList = ({ serviceContainerProjects, componentId }: IProjectsList) => {
  return (
    <>
      <Toolbar>
        <ToolbarItem>
          <Filtering filterOptions={filterOptions} componentId={componentId} />
        </ToolbarItem>
        <ToolbarItem>
          <Sorting sortOptions={sortOptions} componentId={componentId} />
        </ToolbarItem>
        <ToolbarItem>
          <ProtectedComponent>
            <ActionButton link="create">Create Project</ActionButton>
          </ProtectedComponent>
        </ToolbarItem>
      </Toolbar>

      <ContentBox borderTop>
        <ServiceContainerLoading {...serviceContainerProjects} title={`${PageTitles.projects}`}>
          <TableComposable variant="compact">
            <Thead>
              <Tr>
                <Th width={30}>Name</Th>
                <Th>Description</Th>
                <Th width={15}>Build Configs count</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {serviceContainerProjects.data?.content.map((project: Project, rowIndex: number) => (
                <Tr key={rowIndex}>
                  <Td>{<ProjectLink id={project.id}>{project.name}</ProjectLink>}</Td>
                  <Td>{project.description}</Td>
                  <Td>{Object.keys(project.buildConfigs || []).length}</Td>
                  <Td>
                    <ProtectedComponent>
                      <Link to={`${project.id}/edit`}>edit</Link>
                    </ProtectedComponent>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableComposable>
        </ServiceContainerLoading>
      </ContentBox>

      {/* Pagination need to be outside of ServiceContainerLoading so that it can initialize Query Params */}
      <Pagination componentId={componentId} count={serviceContainerProjects.data?.totalHits} />
    </>
  );
};
