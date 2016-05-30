# -*- coding:utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

from IPython.core.magic import Magics, magics_class, line_magic
from IPython.core.magic_arguments import argument, magic_arguments, parse_argstring


@magics_class
class JsMVAMagic(Magics):
    def __init__(self, shell):
        super(JsMVAMagic, self).__init__(shell)

    @line_magic
    @magic_arguments()
    @argument('arg', nargs="?", default="on", help='Enable/Disable JavaScript visualisation for TMVA')
    def jsmva(self, line):
        from JPyInterface import functions
        args = parse_argstring(self.jsmva, line)
        if args.arg == 'on':
           functions.register()
        elif args.arg == 'off':
           functions.unregister()

def load_ipython_extension(ipython):
    ipython.register_magics(JsMVAMagic)