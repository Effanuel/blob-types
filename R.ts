const captureGroup = ({regex, value}: {regex: RegExp; value: string}) => regex.exec(value)?.[1] ?? null;

export default {
  captureGroup,
};
