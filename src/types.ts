type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type LiteralUnion<LiteralType extends BaseType, BaseType extends Primitive> = LiteralType | (BaseType & { _?: never });

export type Platform = 'ubuntu' | 'macos' | 'windows' | 'darwin' | 'linux' | 'win32';

export type Version = LiteralUnion<'canary', string>;
