// Param lists for typed navigation.

export type ArticlesStackParamList = {
  ArticlesList: undefined;
  ArticleDetail: { id: number; title: string };
};

export type RootTabParamList = {
  Clock: undefined;
  World: undefined;
  Articles: undefined;
  Settings: undefined;
};
