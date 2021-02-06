const { gql } = require('apollo-server-express');

module.exports = gql`
  type Board {
    id: ID!
    title: String!
    position: Int!
    createdAt: String!
  }
  type Thread {
    id: ID!
    boardId: ID!
    pined: Boolean!
    closed: Boolean!
    title: String!
    body: String!
    createdAt: String!
    author: [Author]!
    edited: [Edited]
    likes: [Like]!
    likeCount: Int!
    attach: [Attach]
  }
  type Answer {
    id: ID!
    threadId: ID!
    body: String!
    createdAt: String!
    author: [Author]!
    edited: [Edited]
    likes: [Like]!
    likeCount: Int!
    attach: [Attach]
  }

  type Author {
    id: ID!
    username: String!
  }
  type Edited {
    createdAt: String!
  }
  type Like {
    username: String!
    createdAt: String!
  }
  type Attach {
    file: String!
    type: String!
  }

  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
    onlineAt: String!
    picture: String
    role: String
  }

  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }

  type Query {
    getBoards: [Board]
    getBoard(id: ID!): Board

    getThreads(boardId: ID!): [Thread]
    getThread(id: ID!): Thread
    getRecentlyThreads: [Thread]

    getAnswers(threadId: ID!): [Answer]

    getUsers: [User]
    getUser(id: ID!): User
  }

  type Mutation {
    login(username: String!, password: String!): User!
    register(registerInput: RegisterInput): User!

    createBoard(title: String!, position: Int!): Board!
    deleteBoard(id: ID!): String!
    editBoard(id: ID!, title: String!, position: Int): Board!

    createThread(boardId: ID!, title: String!, body: String!): Thread!
    deleteThread(id: ID!): String!
    editThread(id: ID!, title: String!, body: String!): Thread!
    likeThread(id: ID!): Thread!

    createAnswer(threadId: ID!, body: String!): Answer!
    deleteAnswer(id: ID!): String!
    editAnswer(id: ID!, body: String!): Answer!
    likeAnswer(id: ID!): Answer!
  }

  type Subscription {
    newThread: Thread!
    newAnswer: Answer!
  }
`;
