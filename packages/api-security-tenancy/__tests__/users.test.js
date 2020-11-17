import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityUser";
import groupMocks from "./mocks/securityGroup";
import md5 from "md5";

const createGravatar = email => `https://www.gravatar.com/avatar/${md5(email)}`;

describe("Security User CRUD Test", () => {
    const { install, securityUser, securityGroup } = useGqlHandler();
    let groupA;

    beforeEach(async () => {
        await install.install({
            data: { firstName: "John", lastName: "Doe", login: "admin@webiny.com" }
        });
    });

    test("should create, read, update and delete users", async () => {
        // Let's create a group.
        let [response] = await securityGroup.create({
            data: groupMocks.groupA
        });

        groupA = response.data.security.createGroup.data;
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: groupMocks.groupA,
                        error: null
                    }
                }
            }
        });

        // Let's create a user.
        [response] = await securityUser.create({
            data: {
                ...mocks.userA,
                group: groupA.slug
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: {
                            ...mocks.userA,
                            gravatar: createGravatar(mocks.userA.login),
                            group: {
                                slug: groupMocks.groupA.slug,
                                name: groupMocks.groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await securityUser.create({
            data: {
                ...mocks.userB,
                group: groupA.slug
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: {
                            ...mocks.userB,
                            gravatar: createGravatar(mocks.userB.login),
                            group: {
                                slug: groupA.slug,
                                name: groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Let's check whether both of the group exists
        [response] = await securityUser.list();

        expect(response).toMatchObject({
            data: {
                security: {
                    listUsers: {
                        data: [
                            {
                                firstName: "John",
                                lastName: "Doe",
                                login: "admin@webiny.com",
                                group: {
                                    slug: "full-access"
                                }
                            },
                            {
                                ...mocks.userA,
                                gravatar: createGravatar(mocks.userA.login),
                                group: {
                                    slug: groupA.slug,
                                    name: groupA.name
                                }
                            },
                            {
                                ...mocks.userB,
                                gravatar: createGravatar(mocks.userB.login),
                                group: {
                                    slug: groupA.slug,
                                    name: groupA.name
                                }
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's update the "userB" name
        const updatedName = "User B";
        [response] = await securityUser.update({
            login: mocks.userB.login,
            data: {
                lastName: updatedName
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateUser: {
                        data: {
                            ...mocks.userB,
                            lastName: updatedName,
                            gravatar: createGravatar(mocks.userB.login),
                            group: {
                                name: "Group-A",
                                slug: "group-a"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Delete  "userB"
        [response] = await securityUser.delete({
            login: mocks.userB.login
        });

        expect(response).toEqual({
            data: {
                security: {
                    deleteUser: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "userB"
        [response] = await securityUser.get({
            login: mocks.userB.login
        });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `User "${mocks.userB.login}" was not found!`
                        }
                    }
                }
            }
        });

        // Should contain "userA"
        [response] = await securityUser.get({ login: mocks.userA.login });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: {
                            ...mocks.userA,
                            gravatar: createGravatar(mocks.userA.login),
                            group: {
                                slug: groupMocks.groupA.slug,
                                name: groupMocks.groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should not allow creating a user if login is taken", async () => {
        // Creating a user with same "email" should not be allowed
        const [response] = await securityUser.create({
            data: { ...mocks.userA, login: "admin@webiny.com" }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: null,
                        error: {
                            code: "USER_EXISTS",
                            message: "User with that login already exists.",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
