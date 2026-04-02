export declare function createTenantExtension(getOrganizationId: () => string | null): (client: any) => {
    $extends: {
        extArgs: import(".prisma/client/runtime/client").InternalArgs<unknown, unknown, {}, unknown>;
    };
};
export declare const createTenantMiddleware: typeof createTenantExtension;
