<?php
/* adds shortcode */
add_shortcode( 'drstk_map', 'drstk_map' );
function drstk_map( $atts ){
  global $errors;
  $cache = get_transient(md5('PREFIX'.serialize($atts)));

  if($cache) {
    return $cache;
  }
  $items = array_map('trim', explode(',', $atts['id']));
  $map_api_key = drstk_get_map_api_key();
  $map_project_key = drstk_get_map_project_key();
  $story = isset($atts['story']) ? $atts['story'] : "no";
  $map_html = "";
  if (!isset($atts['red']) && isset($atts['red_id'])){ $atts['red'] = $atts['red_id']; }
  if (!isset($atts['red_legend_desc']) && isset($atts['red_desc'])){ $atts['red_legend_desc'] = $atts['red_desc']; }
  if (!isset($atts['green']) && isset($atts['green_id'])){ $atts['green'] = $atts['green_id']; }
  if (!isset($atts['green_legend_desc']) && isset($atts['green_desc'])){ $atts['green_legend_desc'] = $atts['green_desc']; }
  if (!isset($atts['blue']) && isset($atts['blue_id'])){ $atts['blue'] = $atts['blue_id']; }
  if (!isset($atts['blue_legend_desc']) && isset($atts['blue_desc'])){ $atts['blue_legend_desc'] = $atts['blue_desc']; }
  if (!isset($atts['yellow']) && isset($atts['yellow_id'])){ $atts['yellow'] = $atts['yellow_id']; }
  if (!isset($atts['yellow_legend_desc']) && isset($atts['yellow_desc'])){ $atts['yellow_legend_desc'] = $atts['yellow_desc']; }
  if (!isset($atts['orange']) && isset($atts['orange_id'])){ $atts['orange'] = $atts['orange_id']; }
  if (!isset($atts['orange_legend_desc']) && isset($atts['orange_desc'])){ $atts['orange_legend_desc'] = $atts['orange_desc']; }

  $shortcode = "<div id='map' data-story='".$story."' data-map_api_key='".$map_api_key."' data-map_project_key='".$map_project_key."'";
  if (isset($atts['base_map'])){
    if ($atts['base_map'] != "none"){
      $shortcode .= " data-basemap='".$atts['base_map']."'";
    }
  }

  if (isset($atts['red_legend_desc']) && isset($atts['red'])) {
    $shortcode .= " data-red='".$atts['red']."'";
    $shortcode .= " data-red_legend_desc='".$atts['red_legend_desc']."'";
  }

  if (isset($atts['blue_legend_desc']) && isset($atts['blue'])) {
    $shortcode .= " data-blue='".$atts['blue']."'";
    $shortcode .= " data-blue_legend_desc='".$atts['blue_legend_desc']."'";
  }

  if (isset($atts['green_legend_desc']) && isset($atts['green'])) {
    $shortcode .= " data-green='".$atts['green']."'";
    $shortcode .= " data-green_legend_desc='".$atts['green_legend_desc']."'";
  }

  if (isset($atts['yellow_legend_desc']) && isset($atts['yellow'])) {
    $shortcode .= " data-yellow='".$atts['yellow']."'";
    $shortcode .= " data-yellow_legend_desc='".$atts['yellow_legend_desc']."'";
  }

  if (isset($atts['orange_legend_desc']) && isset($atts['orange'])) {
    $shortcode .= " data-orange='".$atts['orange']."'";
    $shortcode .= " data-orange_legend_desc='".$atts['orange_legend_desc']."'";
  }

  foreach($items as $item){
    $repo = drstk_get_repo_from_pid($item);
    if ($repo != "drs"){$pid = explode(":",$item); $pid = $pid[1];} else {$pid = $item;}
    if ($repo == "drs"){
      $url = "https://repository.library.northeastern.edu/api/v1/files/" . $item;
      $data = get_response($url);
      $data = json_decode($data);
      if (!isset($data->error)){
        $pid = $data->pid;

        $coordinates = "";
        if(isset($data->coordinates)) {
          $coordinates = $data->coordinates;
        } else if (isset($data->geographic)){
          $location = $data->geographic[0];
          $locationUrl = "http://maps.google.com/maps/api/geocode/json?address=" . urlencode($location);
          $locationData = get_response($locationUrl);
          $locationData = json_decode($locationData);
          if (!isset($locationData->error)) {
            $coordinates = $locationData->results[0]->geometry->location->lat . "," . $locationData->results[0]->geometry->location->lng;
          }
        } else { //no geo data, skip it
          $coordinates = "";
        }
        if ($coordinates == ""){
          continue;
        }

        $title = $data->mods->Title[0];
        $permanentUrl = drstk_home_url() . "item/".$pid;
        $map_html .= "<div class='coordinates' data-pid='".$pid."' data-url='".$permanentUrl."' data-coordinates='".$coordinates."' data-title='".htmlspecialchars($title, ENT_QUOTES, 'UTF-8')."'";

        if (isset($atts['metadata'])){
          $map_metadata = '';
          $metadata = explode(",",$atts['metadata']);
          foreach($metadata as $field){
            if (isset($data->mods->$field)) {
              $this_field = $data->mods->$field;
              if (isset($this_field[0])) {
                $map_metadata .= $this_field[0] . "<br/>";
              }
            }
          }
          $map_html .= " data-metadata='".$map_metadata."'";
        }
        $canonical_object = "";
        if (isset($data->canonical_object)){
          foreach($data->canonical_object as $key=>$val){
            if ($val == 'Video File' || $val == 'Audio File'){
              $canonical_object = insert_jwplayer($key, $val, $data, $data->thumbnails[2]);
            } else {
              $canonical_object = '<img src="'.$data->thumbnails[2].'"/>';
            }
          }
        }
        $map_html .= " data-media-content='".str_replace("'","\"", htmlentities($canonical_object))."'";

        $map_html .= "></div>";

      } else {
        $map_html = $errors['shortcodes']['fail'];
      }
    }
    if ($repo == "wp"){
      $post = get_post($pid);
      $url = $post->guid;
      $title = $post->post_title;
      $description = $post->post_excerpt;
      $custom = get_post_custom($pid);
      if (isset($custom['_map_coords'])){
        $coordinates = $custom['_map_coords'][0];
      } else {
        $coordinates = "";
        continue;
      }
      $data = new StdClass;
      $data->mods = new StdClass;
      $data->mods->Title = array($post->post_title);
      $abs = "Abstract/Description";
      $data->mods->$abs = array($post->post_excerpt);
      $data->canonical_object = new StdClass;
      $url = $post->guid;
      if (strpos($post->post_mime_type, "audio") !== false){
        $type = "Audio File";
      } else if (strpos($post->post_mime_type, "video") !== false){
        $type = "Video File";
      } else {
        $type = "Master Image";
      }
      $data->canonical_object->$url = $type;
      $data->id=$post->ID;
      if(!is_numeric($coordinates[0])) {
        $location = $coordinates;
        $locationUrl = "http://maps.google.com/maps/api/geocode/json?address=" . urlencode($location);
        $locationData = get_response($locationUrl);
        $locationData = json_decode($locationData);
        if (!isset($locationData->error)) {
          $coordinates = $locationData->results[0]->geometry->location->lat . "," . $locationData->results[0]->geometry->location->lng;
        }
      }
      $permanentUrl = drstk_home_url() . "item/wp:".$post->ID;
      $map_html .= "<div class='coordinates' data-pid='".$pid."' data-url='".$permanentUrl."' data-coordinates='".$coordinates."' data-title='".htmlspecialchars($title, ENT_QUOTES, 'UTF-8')."'";

      if (isset($atts['metadata'])){
        $map_metadata = '';
        $metadata = explode(",",$atts['metadata']);
        foreach($metadata as $field){
          if (isset($data->mods->$field)) {
            $this_field = $data->mods->$field;
            if (isset($this_field[0])) {
              $map_metadata .= $this_field[0] . "<br/>";
            }
          }
        }
        $map_html .= " data-metadata='".$map_metadata."'";
      }
      $canonical_object = "";
      if (isset($data->canonical_object)){
        foreach($data->canonical_object as $key=>$val){
          if ($val == 'Video File' || $val == 'Audio File'){
            $canonical_object = do_shortcode('[video src="'.$post->guid.'"]');
          } else {
            $canonical_object = '<img src="'.$post->guid.'"/>';
          }
        }
      }
      $map_html .= " data-media-content='".str_replace("'","\"", htmlentities($canonical_object))."'";

      $map_html .= "></div>";
    }

    if ($repo == "dpla"){
      $url = "http://api.dp.la/v2/items/".$pid."?api_key=b0ff9dc35cb32dec446bd32dd3b1feb7";
      $data = get_response($url);
      $data = json_decode($data);
      if (isset($data->docs[0]->object)){
        $url = $data->docs[0]->object;
      } else {
        $url = "https://dp.la/info/wp-content/themes/berkman_custom_dpla/images/logo.png";
      }
      $title = $data->docs[0]->sourceResource->title;
      $description = $data->docs[0]->sourceResource->description;
      $data->mods = new StdClass;
      $data->mods->Title = array($title);
      $abs = "Abstract/Description";
      $data->mods->$abs = $description;
      $cre = "Creator,Contributor";
      $data->mods->$cre = $data->docs[0]->sourceResource->creator || "";
      $date = "Date Created";
      $data->mods->$date = isset($data->docs[0]->sourceResource->date->displayDate) ? $data->docs[0]->sourceResource->date->displayDate : array();
      $data->canonical_object = new StdClass;
      $data->canonical_object->$url = "Master Image";
      if (!isset($data->docs[0]->sourceResource->spatial)){
        $coordinates = "";
        continue;
      }
      if(!isset($data->docs[0]->sourceResource->spatial[0]->coordinates)) {
        $location = $data->docs[0]->sourceResource->spatial[0]->name;// . $data->docs[0]->sourceResource->spatial[0]->state;
        $locationUrl = "http://maps.google.com/maps/api/geocode/json?address=" . urlencode($location);
        $locationData = get_response($locationUrl);
        $locationData = json_decode($locationData);
        if (!isset($locationData->error)) {
          $coordinates = $locationData->results[0]->geometry->location->lat . "," . $locationData->results[0]->geometry->location->lng;
        }
      } else {
        $coordinates = $data->docs[0]->sourceResource->spatial[0]->coordinates;
      }
      $permanentUrl = drstk_home_url() . "item/dpla:".$pid;
      $map_html .= "<div class='coordinates' data-pid='".$pid."' data-url='".$permanentUrl."' data-coordinates='".$coordinates."' data-title='".htmlspecialchars($data->mods->Title[0], ENT_QUOTES, 'UTF-8')."'";

      if (isset($atts['metadata'])){
        $map_metadata = '';
        $metadata = explode(",",$atts['metadata']);
        foreach($metadata as $field){
          if (isset($data->mods->$field)) {
            $this_field = $data->mods->$field;
            if (is_array($this_field)) {
              $map_metadata .= $this_field[0] . "<br/>";
            } else {
              $map_metadata .= $this_field . "<br/>";
            }
          }
        }
        $map_html .= " data-metadata='".$map_metadata."'";
      }
      $canonical_object = '<img src="'.$url.'"/>';
      $map_html .= " data-media-content='".str_replace("'","\"", htmlentities($canonical_object))."'";

      $map_html .= "></div>";
    }
  }


  if (isset($atts['custom_map_urls']) && ($atts['custom_map_urls'] != '')) {
    $custom_map_urls = explode(",",$atts['custom_map_urls']);
    $custom_map_titles = explode(",",$atts['custom_map_titles']);
    $custom_map_descriptions = explode(",",$atts['custom_map_descriptions']);
    $custom_map_locations = explode(",",$atts['custom_map_locations']);
    $custom_map_color_groups = explode(",",$atts['custom_map_color_groups']);

    foreach($custom_map_urls as $key=>$value) {
      $url = $value;
      $title = $custom_map_titles[$key];
      $title = trim($title,'\'');
      $description = $custom_map_descriptions[$key];
      $description = trim($description,'\'');
      $location = $custom_map_locations[$key];
      $colorGroup = $custom_map_color_groups[$key];

      $coordinates = "";
      $locationUrl = "http://maps.google.com/maps/api/geocode/json?address=" . urlencode($location);
      $locationData = get_response($locationUrl);
      $locationData = json_decode($locationData);
      if (!isset($locationData->error)) {
        $coordinates = $locationData->results[0]->geometry->location->lat . "," . $locationData->results[0]->geometry->location->lng;
      }

      $map_html .= "<div class='custom-coordinates' data-url=".$url." data-coordinates='".$coordinates."' data-title='".htmlspecialchars($title, ENT_QUOTES, 'UTF-8')."' data-description='".htmlspecialchars($description, ENT_QUOTES, 'UTF-8')."' data-colorGroup=".$colorGroup."";
      $map_html .= "></div>";
    }
  }

  $shortcode .= ">".$map_html."</div>";
  $cache_output = $shortcode;
  $cache_time = 1000;
  set_transient(md5('PREFIX'.serialize($atts)) , $cache_output, $cache_time * 60);
  return $shortcode;
}

function drstk_map_shortcode_scripts() {
  global $post, $wp_query, $DRS_PLUGIN_URL;
  if( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'drstk_map') && !isset($wp_query->query_vars['drstk_template_type']) ) {
    wp_register_script('drstk_leaflet',
        $DRS_PLUGIN_URL .'/assets/js/leaflet/leaflet.js',
        array( 'jquery' ));
    wp_enqueue_script('drstk_leaflet');

    wp_register_script('drstk_leaflet_marker_cluster',
        $DRS_PLUGIN_URL.'/assets/js/leaflet/leaflet.markercluster-src.js',
        array('jquery', 'drstk_leaflet'));
    wp_enqueue_script('drstk_leaflet_marker_cluster');

    wp_register_script('drstk_leaflet_message_box',
        $DRS_PLUGIN_URL.'/assets/js/leaflet/leaflet.messagebox-src.js',
        array('jquery', 'drstk_leaflet'));
    wp_enqueue_script('drstk_leaflet_message_box');

    wp_register_script('drstk_leaflet_easy_button',
        $DRS_PLUGIN_URL.'/assets/js/leaflet/leaflet.easybutton-src.js',
        array('jquery', 'drstk_leaflet'));
    wp_enqueue_script('drstk_leaflet_easy_button');

    wp_register_style('drstk_leaflet_css',
        $DRS_PLUGIN_URL.'/assets/css/leaflet.css');
    wp_enqueue_style('drstk_leaflet_css');
    wp_register_script( 'drstk_map',
        $DRS_PLUGIN_URL. '/assets/js/map.js',
        array( 'jquery' ));
    wp_enqueue_script('drstk_map');

    $map_nonce = wp_create_nonce( 'map_nonce' );

    $map_obj = array(
      'ajax_url' => admin_url('admin-ajax.php'),
      'nonce'    => $map_nonce,
      'home_url' => drstk_home_url(),
    );
    wp_localize_script( 'drstk_map', 'map_obj', $map_obj );

  }
}
add_action( 'wp_enqueue_scripts', 'drstk_map_shortcode_scripts');
