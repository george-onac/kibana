/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { SuperTest } from 'supertest';
import { getUrlPrefix } from '../lib/space_test_utils';
import { DescribeFn, TestDefinitionAuthentication } from '../lib/types';

interface CreateTest {
  statusCode: number;
  response: (resp: any) => void;
}

interface CreateTests {
  newSpace: CreateTest;
  alreadyExists: CreateTest;
  reservedSpecified: CreateTest;
}

interface CreateTestDefinition {
  auth?: TestDefinitionAuthentication;
  spaceId: string;
  tests: CreateTests;
}

export function createTestSuiteFactory(esArchiver: any, supertest: SuperTest<any>) {
  const createExpectLegacyForbiddenResponse = (username: string) => (resp: any) => {
    expect(resp.body).to.eql({
      statusCode: 403,
      error: 'Forbidden',
      message: `action [indices:data/write/index] is unauthorized for user [${username}]: [security_exception] action [indices:data/write/index] is unauthorized for user [${username}]`,
    });
  };

  const expectConflictResponse = (resp: any) => {
    expect(resp.body).to.only.have.keys(['error', 'message', 'statusCode']);
    expect(resp.body.error).to.equal('Conflict');
    expect(resp.body.statusCode).to.equal(409);
    expect(resp.body.message).to.match(new RegExp(`A space with the identifier .*`));
  };

  const expectNewSpaceResult = (resp: any) => {
    expect(resp.body).to.eql({
      name: 'marketing',
      id: 'marketing',
      description: 'a description',
      color: '#5c5959',
    });
  };

  const expectRbacForbiddenResponse = (resp: any) => {
    expect(resp.body).to.eql({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Unauthorized to create spaces',
    });
  };

  const expectReservedSpecifiedResult = (resp: any) => {
    expect(resp.body).to.eql({
      name: 'reserved space',
      id: 'reserved',
      description: 'a description',
      color: '#5c5959',
    });
  };

  const makeCreateTest = (describeFn: DescribeFn) => (
    description: string,
    { auth = {}, spaceId, tests }: CreateTestDefinition
  ) => {
    describeFn(description, () => {
      before(() => esArchiver.load('saved_objects/spaces'));
      after(() => esArchiver.unload('saved_objects/spaces'));

      it(`should return ${tests.newSpace.statusCode}`, async () => {
        return supertest
          .post(`${getUrlPrefix(spaceId)}/api/spaces/space`)
          .auth(auth.username, auth.password)
          .send({
            name: 'marketing',
            id: 'marketing',
            description: 'a description',
            color: '#5c5959',
          })
          .expect(tests.newSpace.statusCode)
          .then(tests.newSpace.response);
      });

      describe('when it already exists', () => {
        it(`should return ${tests.alreadyExists.statusCode}`, async () => {
          return supertest
            .post(`${getUrlPrefix(spaceId)}/api/spaces/space`)
            .auth(auth.username, auth.password)
            .send({
              name: 'space_1',
              id: 'space_1',
              color: '#ffffff',
              description: 'a description',
            })
            .expect(tests.alreadyExists.statusCode)
            .then(tests.alreadyExists.response);
        });
      });

      describe('when _reserved is specified', () => {
        it(`should return ${tests.reservedSpecified.statusCode} and ignore _reserved`, async () => {
          return supertest
            .post(`${getUrlPrefix(spaceId)}/api/spaces/space`)
            .auth(auth.username, auth.password)
            .send({
              name: 'reserved space',
              id: 'reserved',
              description: 'a description',
              color: '#5c5959',
              _reserved: true,
            })
            .expect(tests.reservedSpecified.statusCode)
            .then(tests.reservedSpecified.response);
        });
      });
    });
  };

  const createTest = makeCreateTest(describe);
  // @ts-ignore
  createTest.only = makeCreateTest(describe.only);

  return {
    createExpectLegacyForbiddenResponse,
    createTest,
    expectConflictResponse,
    expectNewSpaceResult,
    expectRbacForbiddenResponse,
    expectReservedSpecifiedResult,
  };
}
