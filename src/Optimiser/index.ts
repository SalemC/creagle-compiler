class Optimiser {
    public optimiseAssembly(assembly: string): string {
        // Remove any sequential push and pops, the value will already be in the register.
        return assembly.replaceAll(/\n^ *push (\w+)\n^ *pop \1/gm, '');
    }
}

export { Optimiser };
