(function () {

    const dependenciesCache = (function () {
        let pending = [];
        const resolved = new Map();
        const delegated = new Set();

        function add(name, dependencies, factory) {
            console.log(`Registered: ${name}`);

            dependencies = resolveExclamation(dependencies);

            const module = execute(factory, dependencies);
            if (module === false) {
                addToPending(name, dependencies, factory);
            } else {
                console.log(`Executed: ${name}`);
                addToResolved(name, module);
                resolvePendings();
            }

            console.log(`Pending dependencies count: ${pending.length}`);
        }

        function resolveExclamation(dependencies) {
            return dependencies.map(d => {
                if (d.indexOf('!') > 0) {
                    const parts = d.split('!');
                    const module = parts[0];
                    const loadItem = parts[1];
                    const depName = `${module}_load_${loadItem}`;
                    const delegatedDep = `${module}_delegated_${loadItem}`;
                    const delegatedWaitDep = `${module}_delegated_wait_${loadItem}`;

                    delegated.add(delegatedDep);
                    add(depName, [module], (m) => m.load(loadItem, {toUrl: urlFor}, resoveDelegated(delegatedDep), {}));
                    add(delegatedWaitDep, [delegatedDep], dd => dd);

                    return delegatedWaitDep;
                } else {
                    return d;
                }
            });
        }

        function resoveDelegated(name) {
            return function (val) {
                delegated.delete(name);
                resolved.set(name, val);
                resolvePendings();
            }
        }

        function urlFor(name) {
            return $('script[src]')
                .map(function (s) {
                    return $(this).attr('src')
                })
                .toArray()
                .filter(s => typeof s === 'string' && s.endsWith(name))[0];
        }

        function getDependencies(dependencies) {
            return dependencies.map(d => {
                const module = resolved.get(d);
                return module === undefined ? null : module;
            }).filter(d => d !== null);
        }

        function execute(factory, dependencies) {
            const resolvedDependencies = getDependencies(dependencies);
            if (dependencies.length !== resolvedDependencies.length) {
                return false;
            } else {
                return factory.apply(this, resolvedDependencies);
            }
        }

        function addToPending(name, dependencies, factory) {
            pending.push({name: name, dependencies: dependencies, factory: factory});
        }

        function addToResolved(name, module) {
            resolved.set(name, module);
        }

        // TODO can be optimized. For now every execution will iterate over pending list and try to resolve deps for each pending module
        function resolvePendings() {
            pending = pending.filter(e => {
                const module = execute(e.factory, e.dependencies);
                if (module === false) {
                    return true;
                } else {
                    console.log(`Executed: ${e.name}`);
                    addToResolved(e.name, module);
                    return false;
                }
            });
        }

        function renameDependency(name, newName) {
            // rename if dependency has been resolved
            const module = resolved.get(name);
            if (typeof module !== 'undefined') {
                resolved.delete(name);
                resolved.set(newName, module);
                console.log(`resolved dependency ${name} was renamed to ${newName}`)
            }

            // rename if dependency is pending
            pending.forEach(d => {
                if (d.name === name) {
                    console.log(`Unresolved dependency ${name} was renamed to ${newName}`);
                    d.name = newName
                }
            })
        }

        return {
            add: add,
            renameDependency: renameDependency
        }
    })();

    const nameGenerator = (function () {
        let id = 0;

        function generateName() {
            return `undefined_${id}`;
        }

        function next() {
            id += 1;
            return generateName();
        }


        function last() {
            return generateName();
        }

        return {
            next: next,
            last: last
        }
    })();


    if (typeof window.define === 'undefined') {

        window.define = function (name, dependencies, factory) {
            // if no name and dependencies specified
            if (typeof name !== "string") {
                factory = name;
                name = nameGenerator.next();
                dependencies = [];
            }

            // if no dependencies specified
            if (typeof dependencies === "function") {
                factory = dependencies;
                dependencies = [];
            }

            if (typeof factory === "function") {
                dependenciesCache.add(name, dependencies, factory);
            } else {
                dependenciesCache.add(name, dependencies, () => factory);
            }
        };

        window.define.amd = true;

        window.defineLast = function (name) {
            dependenciesCache.renameDependency(nameGenerator.last(), name);
        };

        window.require = function (dependencies, factory) {
            const name = nameGenerator.next() + "_required";
            dependenciesCache.add(name, dependencies, factory)
        }

    } else {
        console.info('Method define was already defined')
    }

})(window.define);