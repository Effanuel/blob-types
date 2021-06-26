import fs from 'fs';
import R from './R';

const INTERFACE_SIGNATURE = /interface \w+( extends \w+)? {.*?\n}/gs;

const partition = <T>(array: T[], isValid: (elem: T) => boolean): [T[], T[]] =>
  array.reduce(
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[] as T[], [] as T[]],
  );

interface InterfaceTemplate {
  name: string | null;
  extendsName: string | null;
  pureValue: string | undefined;
}

const findInterfaces = (data: string): InterfaceTemplate[] =>
  (data.match(INTERFACE_SIGNATURE) ?? []).map((item) => ({
    name: R.captureGroup({regex: /interface (\w+)/g, value: item}),
    extendsName: R.captureGroup({regex: /interface \w+ extends (\w+) {/g, value: item}),
    pureValue: item.match(/(?<=\n).*\n/gs)?.[0],
  }));

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
      .map((item) => ({...item, pureValue: purify(item), extendsName: null})),
  ];
};

const trimIndentation = (data: string): string => {
  const indentationSpacesCount = /^\s+/g.exec(data)?.[0].length ?? 0;
  return data.replace(new RegExp(`(?<=\n) {${indentationSpacesCount}}`, 'g'), '');
};

const removeName = (data: string): string => data.replace(/\s*interface \w+ (?={)/g, '');

function main() {
  Array.from(Array(5).keys()).map((index) => {
    const filename = `./samples/sample${index + 1}`;
    const data = fs.readFileSync(`${filename}.ts`).toString();

    const foundInterfaces = findInterfaces(trimIndentation(data));

    const result = compressInterfaces(foundInterfaces)
      .map((item) => {
        const secondLevelType = item.pureValue.match(/(?<=: )[A-Z]\w+/g)?.[0];
        const pure = !!secondLevelType
          ? item.pureValue.replace(
              secondLevelType,
              `{\n  ` + foundInterfaces.find((item) => item.name === secondLevelType)?.pureValue + `}`,
            ) // TODO:  copy space count from parent
          : item.pureValue;
        return `interface ${item.name} {\n` + pure + `}\n`;
      })
      .join('\n');

    fs.writeFileSync(`${filename}_blob.ts`, result);
  });
}

main();
