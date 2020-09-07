import {inject as service} from '@ember/service';
import Route from '@ember/routing/route';

import translationsQuery from 'accent-webapp/queries/jipt-translations';
import ApolloSubscription, {
  Subscription,
} from 'accent-webapp/services/apollo-subscription';
import RouteParams from 'accent-webapp/services/route-params';
import Transition from '@ember/routing/-private/transition';
import IndexController from 'accent-webapp/pods/logged-in/jipt/index/controller';

export default class IndexRoute extends Route {
  @service('apollo-subscription')
  apolloSubscription: ApolloSubscription;

  @service('route-params')
  routeParams: RouteParams;

  queryParams = {
    query: {
      refreshModel: true,
    },
    page: {
      refreshModel: true,
    },
    document: {
      refreshModel: true,
    },
    version: {
      refreshModel: true,
    },
  };

  subscription: Subscription;

  model(
    {
      query,
      page,
      document,
      version,
    }: {query: any; page: number; document: any; version: any},
    transition: Transition
  ) {
    const variables: {
      projectId: string,
      query: string,
      page: number,
      document: string | null,
      version: string | null,
      revisionId?: string
    } = {
      projectId: this.routeParams.fetch(transition, 'logged-in.jipt').projectId,
      query,
      page,
      document,
      version,
    };

    const revisionId = transition.to.queryParams.revisionId;
    if (revisionId) {
      variables.revisionId = revisionId;
    }

    this.subscription = this.apolloSubscription.graphql(
      () => this.modelFor(this.routeName),
      translationsQuery,
      {
        props: (data) => ({
          project: data.viewer.project,
          documents: data.viewer.project.documents.entries,
          versions: data.viewer.project.versions.entries,
          translations: data.viewer.project.revision.translations,
          selectedTranslationIds: this.routeParams.fetch(
            transition,
            'logged-in.jipt'
          ).transitionIds,
        }),
        options: {
          fetchPolicy: 'cache-and-network',
          variables,
        },
      }
    );

    return this.subscription.currentResult();
  }

  activate() {
    window.scrollTo(0, 0);
  }

  deactivate() {
    this.apolloSubscription.clearSubscription(this.subscription);
  }

  resetController(controller: IndexController, isExiting: boolean) {
    if (isExiting) {
      controller.page = 1;
    }
  }
}
