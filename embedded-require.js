(function(){

	var dependenciesCache = (function(){
		var pending = [];
		var resolved = new Map();

		function add(name, dependencies, factory) {
			console.log(`Registered: ${name}`);

			var module = execute(factory, dependencies);
			if (module === false) {
				addToPending(name, dependencies, factory);
			} else {
				console.log(`Executed: ${name}`);
				addToResolved(name, module);
				resolvePendings();
			}

			console.log(`Pending dependencies count: ${pending.length}`);
		}

		function getDependencies(dependencies) {
			return dependencies.map(function(d) {
				var module = resolved.get(d);
				return module === undefined ? null : module;
			}).filter(d => d !== null);
		}

		function execute(factory, dependencies) {
			var resolvedDependencies = getDependencies(dependencies)
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
				var module = execute(e.factory, e.dependencies);
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
			var module = resolved.get(name);
			if (typeof module !== 'undefined') {
				resolved.delete(name);
				resolved.set(newName, module);
				console.log(`resolved dependency ${name} was renamed to ${newName}`)
			}
			
			// rename if dependency is pending
			pending.forEach(d => {
				if (d.name === name) {
					console.log(`Unresolved dependency ${name} was renamed to ${newName}`)
					d.name = newName
				}
			})
		}

		return {
			add: add,
			renameDependency: renameDependency
		}
	})();

	var nameGenerator = (function(){
		var id = 0;

		function generateName(n) {
			return `undefined_${id}`;
		}

		function next() {
			id += 1;
			return generateName(id);
		}


		function last() {
			return generateName(id);
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

			// add to cache
			if (typeof factory === "function") {
				dependenciesCache.add(name, dependencies, factory);
			} else {
				dependenciesCache.add(name, dependencies, () => factory);
			}
		}

		window.define.amd = true;

		window.defineLast = function(name) {
			dependenciesCache.renameDependency(nameGenerator.last(), name);
		}

		window.require = function (dependencies, factory) {
			var name = nameGenerator.next() + "_required";
			dependenciesCache.add(name, dependencies, factory)
		}	
	} else {
		console.info('Method define was already defined')
	}

})(window.define)