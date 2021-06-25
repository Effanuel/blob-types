import fs from 'fs';

const partition = <T>(array: T[], isValid: (elem: T) => boolean): [T[], T[]] =>
  array.reduce(
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[] as T[], [] as T[]],
  );

interface InterfaceTemplate {
  name: string | undefined;
  value: string;
  extendsName: string | null;
  pureValue: string | undefined;
}

const findInterfaces = (data: string): InterfaceTemplate[] =>
  (data.match(/interface \w+( extends \w+)? {.*?\n}/gs) ?? []).map((item) => {
    const value = item.includes(' extends ') ? item.replace(/ extends \w+/g, '') : item;
    return {
      name: /interface (\w+)/g.exec(item)?.[1],
      extendsName: item.includes(' extends ') ? /interface \w+ extends (\w+) {/g.exec(item)?.[1] ?? null : null,
      pureValue: value.match(/(?<=\n).*\n/gs)?.[0],
      value,
    };
  });

const createPurifier = (interfaces: InterfaceTemplate[]) => {
  const purify = (template: InterfaceTemplate): any => {
    const extendedInterface = interfaces.find(({name}) => name === template.extendsName);
    const pureValue = template.pureValue + (extendedInterface?.pureValue ?? '');
    return extendedInterface?.extendsName ? purify({...extendedInterface, pureValue}) : pureValue;
  };
  return purify;
};

const compressInterfaces = (interfaces: InterfaceTemplate[]) => {
  const [extending, regular] = partition(interfaces, (elem) => !!elem.extendsName);

  const purify = createPurifier(interfaces);
  return [
    ...regular,
    ...extending
      .filter(({extendsName}) => !!extendsName)
      .map((item) => ({...item, pureValue: purify(item), extendsName: null, value: null})),
  ];
};

const trimIndentation = (data: string): string => {
  const indentationSpacesCount = /^\s+/g.exec(data)?.[0].length ?? 0;
  return data.replace(new RegExp(`(?<=\n) {${indentationSpacesCount}}`, 'g'), '');
};

const removeName = (data: string): string => data.replace(/\s*interface \w+ (?={)/g, '');

function main() {
  Array.from(Array(4).keys()).map((index) => {
    const filename = `./samples/sample${index + 1}`;
    const data = fs.readFileSync(`${filename}.ts`).toString();

    const foundInterfaces = findInterfaces(trimIndentation(data));

    const result = compressInterfaces(foundInterfaces)
      .map((item) => `interface ${item.name} {\n` + item.pureValue + '}\n')
      .join('\n');

    fs.writeFileSync(`${filename}_blob.ts`, result);
  });
}

main();
