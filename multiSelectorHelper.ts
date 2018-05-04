/**
 * SelectorBuilder which is used to create selection list(like groups, courses, steps, skills) in select12 style.
 * which makes the list items can be added or deleted by clicking (+/-), it makes more easily to see the available
 * selection list and search them, the function is built based on existing select list, it will hide the original
 * one and render a new list, when you change the new rendered list, it also updates the original select list as well,
 * so the original function won't change, This just makes the list cool, better-look and easy to find.
 * @author Eric
 */
declare let $: any;

export class SelectorBuilder {
    selList: JQuery<HTMLElement>;
    listGroup: JQuery<HTMLElement>;
    select_wrapper: JQuery<HTMLElement>;
    select: JQuery<HTMLElement>;
    form: JQuery<HTMLElement>;
    libWrapper: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    searchTerm: string;
    config: any;
    options: any;

    /**
     * Initialized related element and config
     * @param {JQuery<HTMLElement>} $form
     * @param {JQuery<HTMLElement>} $select
     * @param {Object} config  - config of the panel title
     * @param {Object} options  - config of the list filter (required, allowEmpty)
     */
    constructor($form: JQuery<HTMLElement>, $select: JQuery<HTMLElement>, config: object, options?: object) {
        this.container = $('#main-content');
        this.form = $form;
        this.select = $select;
        this.config = config ? config : {};
        this.searchTerm = '';
        this.options = options ? options : {'required': false, 'isAllowedEmpty': false};
    }

    /**
     * assign element to class members, doing this way, every rendered library list will be unique
     */
    public buildList(): void {
        if (this.form.find(this.select).length < 1) {
            return;
        }

        this.selList = this.form.find(this.select);
        this.select_wrapper = this.select.parent();
        this.listGroup = this.select_wrapper.find('ul.list-group');

        this.renderList();
        this.setUpEvents();
    }

    /**
     * render two list wrapper by using lib template in the 'partials/step-library.twig' file
     */
    private renderList(): void {
        const $libTemplate = this.container.children('.select-lib--js').clone().removeClass('hidden');
        if (!$libTemplate.length) {
            return;
        }

        this.select_wrapper.after($libTemplate);
        this.select_wrapper.addClass('hidden');
        this.libWrapper = this.select_wrapper.parent().find('.select-lib--js');
        this.renderItems();
    }

    /**
     * render items on the library wrapper and selected list wrapper based the original selected value
     */
    private renderItems(): void {
        let $libWrap = this.libWrapper.find('.group-lib');
        let $selWrap = this.libWrapper.find('.group-sel');
        this.select.children().each((key, el) => {
            let $item;
            let $toWrap;
            if ($(el).is(':selected')) {
                $toWrap = $selWrap;
                $item = SelectorBuilder.libItemTemplate($(el).html(), true);
            } else {
                $toWrap = $libWrap;
                $item = SelectorBuilder.libItemTemplate($(el).html(), false);
            }
            if ($(el).val()) {
                $item.attr('data-value', $(el).val());
                $toWrap.append($item);
            }
        });
        this.setPanelTitles();
    }

    /**
     * set panel title based the title config
     */
    private setPanelTitles(): void {
        this.libWrapper.find('.panel-title--js').html(this.config.searchTitle);
        this.libWrapper.find('.panel-title-result--js').html(this.config.resultTitle);
    }

    /**
     * set up click and on change event for toggle btn(+/-) or search input
     */
    private setUpEvents(): void {
        this.libWrapper.on('click', '.toggle-btn', (e) => {
            let target = $(e.target);
            let $parent = target.closest('.list-group-item');
            // append item and toggle icon
            if (target.closest('.group-lib').length) {
                $parent.detach().appendTo(this.libWrapper.find('ul.group-sel'));
                $parent.find('.fa').removeClass('fa-plus').addClass('fa-minus');
            } else if (target.closest('.group-sel').length) {
                $parent.detach().appendTo(this.libWrapper.find('ul.group-lib'));
                $parent.find('.fa').removeClass('fa-minus').addClass('fa-plus');
            } else {
                return;
            }
            // trigger list change
            this.onListChange();
        });

        this.libWrapper.on('keyup', '.steps-search-area input', (e) => {
            const keyCode = e.keyCode || e.which;

            if (keyCode === 13) {
                e.preventDefault();
                return false;
            }
            this.searchLibrary($(e.target).val());
        });
    }

    /**
     * on list change listener to trigger update List when the item changes between two list
     */
    private onListChange(): void {
        this.updateList();
        if (this.options.required) {
            this.valid();
        }
    };

    /**
     * updated original select value when list items change
     */
    private updateList(): void {
        let sel_ids = [];

        // selected list
        this.libWrapper.find('.group-sel li').each(function () {
            sel_ids.push($(this).attr('data-value'));
        });
        this.select.val(sel_ids);
    }

    /**
     * check is select list valid, return a boolean value as public for use
     * @return {boolean}
     */
    public valid(): boolean {  // you can use selectBuilder.valid() to check is this list valid or not
        let selectedItems = this.libWrapper.find('ul.group-sel');
        let countSelectedItems = selectedItems.children().length;
        if (countSelectedItems === 0) {
            this.showRequiredError();
            return false;
        } else {
            this.showRequiredError(false);
            return true;
        }
    }

    /**
     * show help error or clean help error the below list
     * @param {boolean} isShowing - if it's not true, clean error
     */
    private showRequiredError(isShowing = true): void {
        let selectedWrapper = this.libWrapper.find('.sel-wrapper');
        if (isShowing) {
            selectedWrapper.addClass('has-error');
            if (!selectedWrapper.find('p.help-block').length) {   // prevent duplicated append
                selectedWrapper.append('<p class="help-block">This field is required.</p>')
            }
        } else {
            selectedWrapper.removeClass('has-error').find('p.help-block').remove();
        }
    }

    /**
     * search from library
     * @param {string} text
     */
    private searchLibrary(text = ''): void {
        //Don't re-run a search we're already displaying
        if (this.searchTerm === text) {
            return;
        }

        this.searchTerm = text;

        if (text === '') {
            //just show everything
            this.libWrapper.find('.group-lib li').each((i, el) => {
                const $el = $(el);
                $el.children('.title').html($el.children('.title').text());
                $el.show().removeData('searchTitle');
            });
        } else {
            //run search
            this.libWrapper.find('.group-lib li').each((i, el) => {
                const $el = $(el);
                SelectorBuilder.searchItem($el, text);
            });
        }
    };

    /**
     * Searchable/Sortable list
     * @param $el  - search item's parent element
     * @param text - search text value
     */
    private static searchItem($el, text): void {
        let $list = $el.closest('.list-group');
        let title = $el.children('.title').text();

        if ($list.hasClass('group-lib')) {
            let re = new RegExp('^(.*?)(' + SelectorBuilder.escapeRegExp(text) + ')(.*?)$', 'i');
            let match = re.exec(title);

            if (match) {
                title = match[1];
                title += '<strong>' + match[2] + '</strong>';
                title += match[3];
            }

            $el.children('.title').html(title);
            $el.toggle(match !== null);
        } else {
            $el.children('.title').html(title);
        }
    }

    /**
     * filter special chars
     * @param string
     * @return {string}
     */
    private static escapeRegExp(string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    /**
     * Library / select list item template
     * @param {string} value
     * @param {boolean} isSelected  - check to create item with (+/-)
     * @return {JQuery<HTMLElement>}
     */
    private static libItemTemplate(value: string, isSelected: boolean): JQuery<HTMLElement> {
        if (isSelected) {
            return $('<li>', {class: 'list-group-item'}).append(
                $('<span class="title">' + value +
                    '</span><a class="toggle-btn"><i class="fa fa-minus"></i></a>')
            );
        } else {
            return $('<li>', {class: 'list-group-item'}).append(
                $('<span class="title">' + value +
                    '</span><a class="toggle-btn"><i class="fa fa-plus"></i></a>')
            );
        }
    }
}