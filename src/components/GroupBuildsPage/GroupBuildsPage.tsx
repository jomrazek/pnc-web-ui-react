import { Divider, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core';

import { PageTitles } from 'common/PageTitles';

import { useTitle } from 'hooks/useTitle';

export const GroupBuildsPage = () => {
  useTitle(PageTitles.groupBuilds);
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">GroupBuildsPage</Text>
          <Text component="p">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam quos unde, accusantium excepturi ad praesentium.
          </Text>
        </TextContent>
      </PageSection>

      <Divider component="div" />
    </>
  );
};
