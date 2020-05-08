import path from 'path';

import normalizePath from 'normalize-path';
import globParent from 'glob-parent';

/* eslint-disable no-param-reassign */

function getAbsoluteContext(context) {
  const result = normalizePath(path.resolve(context));

  return result.replace(
    // eslint-disable-next-line no-useless-escape
    /[\*|\?|\!|\||\@|\+|\(|\)|\[|\]|\{|\}]/g,
    (substring) => `\\${substring}`
  );
}

function createPatternGlob(pattern, globalRef) {
  const { logger, compilation } = globalRef;

  pattern.globOptions = Object.assign(
    {
      cwd: pattern.context,
      followSymbolicLinks: true,
    },
    pattern.globOptions || {}
  );

  switch (pattern.fromType) {
    case 'dir':
      logger.debug(`determined '${pattern.absoluteFrom}' is a directory`);
      logger.debug(`add ${pattern.absoluteFrom} as contextDependencies`);
      compilation.contextDependencies.add(pattern.absoluteFrom);

      pattern.context = pattern.absoluteFrom;
      pattern.glob = path.posix.join(
        getAbsoluteContext(pattern.absoluteFrom),
        '**/*'
      );
      pattern.absoluteFrom = path.join(pattern.absoluteFrom, '**/*');
      pattern.globOptions = {
        dot: true,
      };
      break;

    case 'file':
      logger.debug(`determined '${pattern.absoluteFrom}' is a file`);
      logger.debug(`add ${pattern.absoluteFrom} as fileDependencies`);
      compilation.fileDependencies.add(pattern.absoluteFrom);

      pattern.context = path.dirname(pattern.absoluteFrom);
      pattern.glob = getAbsoluteContext(pattern.absoluteFrom);
      pattern.globOptions = {
        dot: true,
      };
      break;

    default:
      logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);

      // eslint-disable-next-line no-case-declarations
      const contextDependencies = path.normalize(
        globParent(pattern.absoluteFrom)
      );

      logger.debug(`add ${contextDependencies} as contextDependencies`);
      compilation.contextDependencies.add(contextDependencies);

      pattern.fromType = 'glob';
      pattern.globOptions = pattern.globOptions || {};
      pattern.glob = path.isAbsolute(pattern.fromOrigin)
        ? pattern.fromOrigin
        : path.posix.join(
            getAbsoluteContext(pattern.context),
            pattern.fromOrigin
          );
  }

  return pattern;
}

export default createPatternGlob;